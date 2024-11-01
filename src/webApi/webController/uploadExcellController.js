import path from "path";
import fs from "fs";
import ExcelJS from "exceljs";
import sanitize from "sanitize-html";
import Beneficiary from "../webModel/benificiaryDetail.js";
import KhatauniDetails from "../webModel/khatauniDetailsSchema.js";
import LandPrice from "../webModel/landPrice.js";
import VillageList from "../webModel/villageListSchema.js";
import BeneficiaryDisbursementDetails from "../webModel/beneficiaryDisbursementDetails.js";
import OldBeneficiaryDisbursement from "../webModel/beneficiaryDisbursementDetails - old Data.js";

export const uploadExcel = async (req, res) => {
  if (!req.file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded." });
  }

  const { villageId } = req.body;
  const userId = req.user.id;

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
    if (!fs.existsSync(filePath)) throw new Error("File not found");

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.getWorksheet(1);
    const processedRows = new Set();
    let landPriceId = null;

    // Fetch any existing LandPrice and KhatauniDetails once
    const existingLandPrices = await LandPrice.find({
      villageId: sanitizedVillageId,
    });

    // Process land price per square meter (bulk insert if needed)
    for (
      let rowNumber = 2;
      rowNumber <= worksheet.lastRow.number;
      rowNumber++
    ) {
      const row = worksheet.getRow(rowNumber);
      const serialNumber = Number(row.getCell("B").value);
      if (isNaN(serialNumber)) {
        const landPricePerSqMtr = sanitize(
          row.getCell("J").value?.toString() || ""
        ).trim();
        if (landPricePerSqMtr) {
          const existingLandPrice = existingLandPrices.find(
            (lp) => lp.landPricePerSqMtr === landPricePerSqMtr
          );
          if (existingLandPrice) {
            landPriceId = existingLandPrice._id;
          } else {
            const newLandPrice = await LandPrice.create({
              landPricePerSqMtr,
              villageId: sanitizedVillageId,
              update: { userId, updatedAt: new Date(), action: "0" },
            });
            landPriceId = newLandPrice._id;
          }
          break;
        }
      }
    }

    let lastValidKhatauniSankhya = null;
    for (
      let rowNumber = 2;
      rowNumber <= worksheet.lastRow.number;
      rowNumber++
    ) {
      const row = worksheet.getRow(rowNumber);
      const khatauniSankhya = row.getCell("A").value;
      const serialNumber = Number(row.getCell("B").value);

      const beneficiaryName = sanitize(
        row.getCell("C").value?.toString() || ""
      );

      if (serialNumber === 1 && !lastValidKhatauniSankhya) {
        lastValidKhatauniSankhya = khatauniSankhya;
      }

      if (!isNaN(serialNumber)) {
        lastValidKhatauniSankhya = khatauniSankhya;
      } else if (isNaN(serialNumber) && lastValidKhatauniSankhya) {
        let bhumiCompensation = sanitize(
          row.getCell("K").value?.toString()
        ).trim();
        let faldaarBhumiCompensation = sanitize(
          row.getCell("L").value?.toString()
        ).trim();
        let gairFaldaarBhumiCompensation = sanitize(
          row.getCell("M").value?.toString()
        ).trim();
        let makaanCompensation = sanitize(
          row.getCell("N").value?.toString()
        ).trim();
        let totalAcquiredBhumi = sanitize(
          row.getCell("I").value?.toString()
        ).trim();

        const updateFields = {};
        if (bhumiCompensation)
          updateFields.bhumiCompensation = bhumiCompensation;
        if (faldaarBhumiCompensation)
          updateFields.faldaarBhumiCompensation = faldaarBhumiCompensation;
        if (gairFaldaarBhumiCompensation)
          updateFields.gairFaldaarBhumiCompensation =
            gairFaldaarBhumiCompensation;
        if (makaanCompensation)
          updateFields.makaanCompensation = makaanCompensation;
        if (totalAcquiredBhumi)
          updateFields.totalAcquiredBhumi = parseFloat(
            totalAcquiredBhumi.split("-").join("")
          );
        updateFields.landPriceId = landPriceId;

        if (Object.keys(updateFields).length > 0) {
          await KhatauniDetails.updateOne(
            {
              khatauniSankhya: lastValidKhatauniSankhya,
              villageId: sanitizedVillageId,
            },
            { $set: updateFields },
            { upsert: true }
          );
        }
        continue;
      }

      if (khatauniSankhya && serialNumber && beneficiaryName) {
        const uniqueKey = `${khatauniSankhya}-${serialNumber}-${beneficiaryName}`;

        if (processedRows.has(uniqueKey)) continue;
        processedRows.add(uniqueKey);

        const existingBeneficiary = await Beneficiary.findOne({
          serialNumber,
          beneficiaryName,
        });
        if (existingBeneficiary) {
          return res.status(409).json({
            success: false,
            message:
              "Duplicate entries found. The data has already been uploaded.",
          });
        }

        const existingKhatauniDetails = await KhatauniDetails.findOne({
          villageId: sanitizedVillageId,
          khatauniSankhya,
        });
        let khatauniId = null;

        // Function to clean and sanitize cell data
        function cleanCellData(cell) {
          if (!cell || !cell.value) return "";

          const value = Array.isArray(cell.value)
            ? cell.value.map((item) => item.toString().trim()).join(", ")
            : cell.value.toString();

          const cleanedValue = value
            .split(/\n|\r/)
            .map((item) => item.trim())
            .filter((item) => item.length > 0)
            .join(", ");

          return cleanedValue.replace(/\s+/g, " ").trim();
        }

        function extractRichText(cell) {
          if (!cell) return "";

          if (cell.richText && Array.isArray(cell.richText)) {
            return cell.richText
              .map((segment) => segment.text)
              .join(", ")
              .trim();
          } else if (cell.value) {
            return sanitize(cell.value.toString().trim());
          } else {
            return "";
          }
        }

        if (!existingKhatauniDetails) {
          const rawAcquiredKhasraNumber = extractRichText(row.getCell("F"));

          const toString = (value) => {
            if (value && typeof value === "object" && value.text) {
              return value.text;
            }
            return String(value);
          };

          let acquiredKhasraNumber = toString(rawAcquiredKhasraNumber);

          acquiredKhasraNumber = acquiredKhasraNumber
            .replace(/\s+/g, " ")
            .trim();

          acquiredKhasraNumber = sanitize(acquiredKhasraNumber);

          const newKhatauni = await KhatauniDetails.create({
            khatauniSankhya: sanitize(khatauniSankhya),
            khasraNumber: sanitize(cleanCellData(row.getCell("D"))),
            acquiredKhasraNumber: acquiredKhasraNumber,
            areaVariety: sanitize(cleanCellData(row.getCell("E"))),
            acquiredRakbha: sanitize(cleanCellData(row.getCell("G"))),
            update: { userId, updatedAt: new Date(), action: "0" },
            villageId: sanitizedVillageId,
          });
          khatauniId = newKhatauni._id;
        } else {
          khatauniId = existingKhatauniDetails._id;
        }

        const beneficiary = {
          khatauniSankhya: sanitize(String(khatauniSankhya)).trim(),
          serialNumber,
          beneficiaryName,
          beneficiaryShare: sanitize(
            getCellValue(row.getCell("H").value)?.toString().trim() || ""
          ),
          acquiredBeneficiaryShare: sanitize(
            getCellValue(row.getCell("I").value)?.toString().trim() || ""
          ),
          villageId: sanitizedVillageId,
          landPriceId,
          khatauniId,
          update: { userId, updatedAt: new Date(), action: "0" },
        };

        const savedBeneficiary = await Beneficiary.create(beneficiary);

        function getCellValue(cell) {
          if (typeof cell === "object" && cell !== null) {
            return cell.result ? cell.result.toString() : JSON.stringify(cell);
          }
          return cell ? cell.toString() : "";
        }
        function customSanitize(input) {
          if (!input) return "";
          return input
            .replace(
              /[^\u0900-\u097F\u0020-\u007E\u0966-\u096F\u2000-\u206F]/g,
              ""
            )
            .trim();
        }
        function extractText(richText) {
          const extractedText = richText
            .map((item) => {
              return customSanitize(item.text);
            })
            .filter((text) => text.trim() !== "")
            .join(" ");
          return extractedText;
        }
        const vivranData = { richText: [] };
        const rawVivran = getCellValue(row.getCell("T").value);
        const segments = rawVivran.split(/,\s*|\.\s*|\s+:/).filter(Boolean);
        segments.forEach((segment) => {
          vivranData.richText.push({
            text: customSanitize(segment),
          });
        });
        const extractedVivranText = extractText(vivranData.richText);
        // Ensure that vivran contains only the plain text extracted from richText
        const disbursementDetails = {
          bhumiPrice:
            Number(customSanitize(getCellValue(row.getCell("K").value))) || 0,
          faldaarBhumiPrice:
            Number(customSanitize(getCellValue(row.getCell("L").value))) || 0,
          gairFaldaarBhumiPrice:
            Number(customSanitize(getCellValue(row.getCell("M").value))) || 0,
          housePrice:
            Number(customSanitize(getCellValue(row.getCell("N").value))) || 0,
          toshan:
            String(customSanitize(getCellValue(row.getCell("P").value))) || "0",
          interest:
            String(customSanitize(getCellValue(row.getCell("R").value))) || "0",
          totalCompensation:
            Number(customSanitize(getCellValue(row.getCell("S").value))) || 0,
          vivran: extractedVivranText, // vivran field with sanitized text
          isDisbursementUploaded: "0",
          isConsent: "0",
          isApproved: "0",
          isRejected: "0",
          rejectedMessage: customSanitize(getCellValue(row.getCell("Z").value)),
          updatedAt: new Date(),
          update: {
            userId,
            updatedAt: new Date(),
            action: "0",
          },
          villageId: sanitizedVillageId,
          beneficiaryId: savedBeneficiary._id,
        };
        const convertFields = (details) => {
          return {
            bhumiPrice: Number(details.bhumiPrice),
            faldaarBhumiPrice: Number(details.faldaarBhumiPrice),
            gairFaldaarBhumiPrice: Number(details.gairFaldaarBhumiPrice),
            housePrice: Number(details.housePrice),
            toshan: String(details.toshan),
            interest: String(details.interest),
            totalCompensation: Number(details.totalCompensation),
            villageId: String(details.villageId),
            beneficiaryId: String(details.beneficiaryId),
            vivran: details.vivran,
            update: {
              userId: String(details.update.userId),
              updatedAt: details.update.updatedAt,
              action: String(details.update.action),
            },
          };
        };
        const typedDisbursementDetails = convertFields(disbursementDetails);
        await BeneficiaryDisbursementDetails.updateOne(
          {
            beneficiaryId: savedBeneficiary._id,
            villageId: sanitizedVillageId,
          },
          { $set: typedDisbursementDetails },
          { upsert: true }
        );
        await OldBeneficiaryDisbursement.updateOne(
          {
            beneficiaryId: savedBeneficiary._id,
            villageId: sanitizedVillageId,
          },
          { $set: typedDisbursementDetails },
          { upsert: true }
        );
      }
    }

    const beneficiaries = await Beneficiary.find({
      villageId: sanitizedVillageId,
    })
      .populate("khatauniId", "khatauniSankhya serialNumber")
      .select("acquiredBeneficiaryShare");

    const khatauniSankhyaSet = new Set();
    let acquiredVillageArea = 0;

    if (Array.isArray(beneficiaries) && beneficiaries.length > 0) {
      beneficiaries.forEach((beneficiary) => {
        if (beneficiary.khatauniId) {
          khatauniSankhyaSet.add(beneficiary.khatauniId.khatauniSankhya);

          const acquiredShare = beneficiary.acquiredBeneficiaryShare
            ? parseFloat(
                beneficiary.acquiredBeneficiaryShare.split("-").join("")
              )
            : 0;

          if (typeof acquiredShare === "number") {
            acquiredVillageArea += acquiredShare;
          }
        }
      });
    }

    await VillageList.findOneAndUpdate(
      { _id: villageId },
      {
        $set: {
          khatauni: khatauniSankhyaSet.size,
          totalBeneficiaries: beneficiaries.length,
          villageArea: String(acquiredVillageArea),
          landPriceId,
          update: { userId, updatedAt: new Date(), action: "0" },
        },
      },
      { new: true }
    ).catch((err) => {
      console.error("Error updating village:", err);
    });

    res.status(200).json({
      success: true,
      message: "Beneficiaries records uploaded successfully",
    });
  } catch (error) {
    console.error("Error processing Excel upload:", error.message);
    res.status(500).json({
      success: false,
      message: `Error processing file: ${error.message}`,
    });
  }
};
