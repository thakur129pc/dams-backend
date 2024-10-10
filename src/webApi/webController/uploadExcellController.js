import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";
import sanitize from 'sanitize-html';
import Beneficiary from "../webModel/benificiaryDetail.js";
import KhatauniDetails from "../webModel/khatauniDetailsSchema.js";
import LandPrice from "../webModel/landPrice.js"; // Import the LandPrice model
import VillageList from "../webModel/villageListSchema.js";
import BeneficiarDisbursementDetails from "../webModel/beneficiaryDisbursementDetails.js";
import OldBeneficiarDisbursement from "../webModel/beneficiaryDisbursementDetails - old Data.js";
import { fileURLToPath } from "url";

// Get the directory name from the module URL
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadExcel = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded." });
  }
  const { villageId } = req.body;
  const userId = req.user.id;
  // Sanitize villageId and check if it's valid
  const sanitizedVillageId = sanitize(villageId, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim();
  if (!sanitizedVillageId) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid villageId." });
  }
  try {
    const filePath = path.resolve("public/uploads", req.file.filename);
    if (!fs.existsSync(filePath)) {
      throw new Error("File not found");
    }
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1); // Assume first sheet
    const columnMappings = {
      A: "khatauniSankhya",
      C: "beneficiaryName",
      H: "beneficiaryShare",
      I: "acquiredBeneficiaryShare",
      B: "serialNumber",
      D: "khasraNumber",
      E: "areaVariety",
      F: "acquiredKhasraNumber",
      G: "acquiredRakbha",
      J: "landPricePerSqMtr",
      K: "bhumiPrice",
      L: "faldaarBhumiPrice",
      M: "gairFaldaarBhumiPrice",
      N: "housePrice",
      P: "toshan",
      R: "interest",
      S: "totalCompensation",
      T: "vivran",
    };
    const uniqueKhatauniSankhyaSet = new Set();
    const uniqueBeneficiaries = new Set(); // Keep track of unique beneficiaries within the Excel
    const beneficiaryPromises = [];
    const processedRows = new Set(); // To track unique rows within the Excel file itself
    let landPriceDetail = {};
    let landPriceId = null;
    // Find land price only once, based on the first row
    let landPricePerSqMtr = worksheet.getRow(2).getCell("J").value;
    if (landPricePerSqMtr) {
      landPricePerSqMtr = sanitize(landPricePerSqMtr.toString()).trim();
      const existingLandPrice = await LandPrice.findOne({
        landPricePerSqMtr,
        villageId: sanitizedVillageId,
      });
      if (existingLandPrice) {
        // Reuse existing land price record
        landPriceId = existingLandPrice._id;
        console.log(
          `Reusing existing land price record with ID: ${landPriceId}`
        );
      } else {
        landPriceDetail = {
          landPricePerSqMtr: landPricePerSqMtr,
          villageId: sanitizedVillageId,
          update: { userId, updatedAt: new Date(), action: "0" },
        };
        const savedLandPrice = await LandPrice.create(landPriceDetail);
        landPriceId = savedLandPrice._id;
        console.log(`New land price record created with ID: ${landPriceId}`);
      }
    }
    worksheet.eachRow({ includeEmpty: false }, async (row, rowNumber) => {
      if (rowNumber > 1) {
        let khatauniSankhya = row.getCell("A").value;
        let serialNumber = row.getCell("B").value;
        let beneficiaryName = sanitize(row.getCell("C").value?.trim() || "");
        if (isNaN(serialNumber)) {
          console.log(
            `Invalid serialNumber: ${serialNumber} at row ${rowNumber}. Skipping row.`
          );
          return;
        }
        uniqueKhatauniSankhyaSet.add(khatauniSankhya);
        serialNumber = Number(serialNumber);
        if (khatauniSankhya && serialNumber && beneficiaryName) {
          const uniqueKey = `${khatauniSankhya}-${serialNumber}-${beneficiaryName}`;
          if (processedRows.has(uniqueKey)) {
            console.log(
              `Duplicate entry found within Excel for khatauniSankhya: ${khatauniSankhya}, serialNumber: ${serialNumber}, beneficiaryName: ${beneficiaryName}. Skipping row ${rowNumber}.`
            );
            return;
          }
          processedRows.add(uniqueKey);
          uniqueBeneficiaries.add(uniqueKey);
          const existingKhatauniDetail = await KhatauniDetails.findOne({
            khatauniSankhya,
            serialNumber,
          });
          const existingBeneficiary = await Beneficiary.findOne({
            khatauniSankhya,
            serialNumber,
            beneficiaryName,
          });
          if (existingKhatauniDetail || existingBeneficiary) {
            console.log(
              `Duplicate entry found in database for khatauniSankhya: ${khatauniSankhya}, serialNumber: ${serialNumber}, beneficiaryName: ${beneficiaryName}. Skipping row ${rowNumber}.`
            );
            return;
          }
          if (typeof khatauniSankhya === "number" && !isNaN(khatauniSankhya)) {
            const beneficiary = {};
            const khatauniDetail = {};
            beneficiary.khatauniSankhya = sanitize(
              khatauniSankhya.toString()
            ).trim();
            khatauniDetail.khatauniSankhya = sanitize(
              khatauniSankhya.toString()
            ).trim();
            for (const [col, field] of Object.entries(columnMappings)) {
              let cellValue = row.getCell(col).value;
              if (cellValue instanceof Date) {
                cellValue = cellValue.toLocaleDateString("en-US");
              } else if (typeof cellValue === "string") {
                cellValue = sanitize(cellValue).replace(/\n/g, " ").trim();
              }
              if (["A", "C", "H", "I"].includes(col)) {
                beneficiary[field] = cellValue || "";
              } else {
                khatauniDetail[field] = cellValue || "";
              }
            }
            beneficiary.villageId = sanitizedVillageId;
            beneficiary.update = { userId, updatedAt: new Date(), action: "0" };
            khatauniDetail.villageId = sanitizedVillageId;
            khatauniDetail.update = {
              userId,
              updatedAt: new Date(),
              action: "0",
            };
            const beneficiaryPromise = (async () => {
              const savedBeneficiary = await Beneficiary.create(beneficiary);
              khatauniDetail.beneficiaryId = savedBeneficiary._id;
              const savedKhatauniDetails = await KhatauniDetails.create(
                khatauniDetail
              );
              await Beneficiary.findOneAndUpdate(
                { _id: khatauniDetail.beneficiaryId },
                {
                  $set: {
                    khatauniId: savedKhatauniDetails._id,
                    landPriceId: landPriceId,
                  },
                },
                { upsert: true, new: true }
              );
              const disbursementDetails = {
                bhumiPrice: sanitize(row.getCell("K").value?.toString() || "0"),
                faldaarBhumiPrice: sanitize(
                  row.getCell("L").value?.toString() || "0"
                ),
                gairFaldaarBhumiPrice: sanitize(
                  row.getCell("M").value?.toString() || "0"
                ),
                housePrice: sanitize(row.getCell("N").value?.toString() || "0"),
                toshan: sanitize(row.getCell("P").value?.toString() || "0"),
                interest: sanitize(row.getCell("R").value?.toString() || "0"),
                totalCompensation: sanitize(
                  row.getCell("S").value?.toString() || "0"
                ),
                villageId: sanitizedVillageId,
                beneficiaryId: savedBeneficiary._id,
                update: { userId, updatedAt: new Date(), action: "0" },
              };
              await BeneficiarDisbursementDetails.create(disbursementDetails);
              await OldBeneficiarDisbursement.create(disbursementDetails);
            })();
            beneficiaryPromises.push(beneficiaryPromise);
          }
        }
      }
    });
    await Promise.all(beneficiaryPromises);
    const uniqueBeneficiariesCount = uniqueBeneficiaries.size;
    console.log("Unique beneficiaries from Excel:", uniqueBeneficiariesCount);
    await VillageList.findOneAndUpdate(
      { _id: sanitizedVillageId },
      {
        $set: {
          khatauni: uniqueKhatauniSankhyaSet.size,
          totalBeneficiaries: uniqueBeneficiariesCount,
          landPriceId: landPriceId,
          update: { userId, updatedAt: new Date(), action: "0" },
        },
      }
    );
    res.status(200).json({
      success: true,
      message: "Beneficiaries records uploaded successfully",
    });
  } catch (error) {
    console.error("Error processing file:", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "An error occurred while processing the file",
      });
  }
};
export { uploadExcel };
