import { ExcelUpload } from '../schema/excelUploadSchema.js'; 
import { catchAsyncError } from '../middleware/catchAsyncError.js';
import ErrorHandler from '../middleware/error.js';

export const uploadExcelData = catchAsyncError(async (req, res, next) => {
    try {
        const newUpload = new ExcelUpload({
            khatauniSankhya: 123,
            serialNumber: 1,
            beneficiaryName: 'Test Name',
            khasraNumber: 'K123',
            acquiredKhasraNumber: 'AK123',
            areaVariety: '500 sq mt',
            acquiredRakhba: '100 sq mt',
            share: '50%',
            beneficiaryShare: '50%',
            landPricePerSqMt: 1000,
            compensationBhoomi: 10000,
            compensationGairFaldaar: 5000,
            compensationFaldaar: 2000,
            compensationmakaan: 3000,
            total: 20000,
            compensation: 18000,
            totalCompensation: 22000,
            interestAmount: 2000,
            completeCompensation: 24000,
            vivran: 10
        });

        if (!newUpload) {
            return next(new ErrorHandler('Please provide the details to upload.', 400));
        }

        const saved = await newUpload.save();
        res.status(201).json({
            success: true,
            message: 'Data uploaded successfully',
            data: saved
        });
    } catch (err) {
        return next(new ErrorHandler(err.message, 500));
    }
});
