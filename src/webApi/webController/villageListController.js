import Village from "../webModel/villageListSchema.js"; // Adjust the path if necessary

// Create a new village (single)
const createVillage = async (req, res) => {
  const {
    villageName,
    villageNameHindi,
    villageArea,
    khatauni,
    totalBeneficiaries,
  } = req.body;
  try {
    const village = new Village({
      villageName,
      villageNameHindi,
      villageArea,
      khatauni,
      totalBeneficiaries,
    });
    const savedVillage = await village.save();
    res.status(201).json({ success: true, savedVillage });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Bulk create villages
const bulkCreateVillages = async (req, res) => {
  const villages = req.body;
  if (!Array.isArray(villages) || villages.length === 0) {
    return res
      .status(400)
      .json({
        success: false,
        message: "Please provide a valid array of villages.",
      });
  }
  try {
    // Create villages in bulk
    const result = await Village.insertMany(villages);
    res.status(201).json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get all villages
const getAllVillages = async (req, res) => {
  try {
    const villages = await Village.find();
    // Map through the villages and rename _id to villageId
    const updatedVillages = villages.map((village) => ({
      villageId: village._id, // Rename _id to villageId
      villageName: village.villageName,
      villageNameHindi: village.villageNameHindi,
      villageArea: village.villageArea,
      khatauni: village.khatauni,
      totalBeneficiaries: village.totalBeneficiaries,
      villageStatus: village.villageStatus,
      interestDays: village.interestDays || "oiu",
    }));
    res.status(200).json({ success: true, villages: updatedVillages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get a single village by ID
const getVillageById = async (req, res) => {
  const { id } = req.params;

  try {
    const village = await Village.findById(id);

    if (!village) {
      return res
        .status(404)
        .json({ success: false, message: "Village not found." });
    }

    res.status(200).json({ success: true, village });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update a village by ID
const updateVillageById = async (req, res) => {
  const { id } = req.params;
  const {
    villageName,
    villageNameHindi,
    villageCode,
    villageArea,
    khatauni,
    totalBeneficiaries,
    villageStatus,
  } = req.body;

  try {
    const updatedVillage = await Village.findByIdAndUpdate(
      id,
      {
        villageName,
        villageNameHindi,
        villageCode,
        villageArea,
        khatauni,
        totalBeneficiaries,
        villageStatus,
      },
      { new: true }
    );

    if (!updatedVillage) {
      return res
        .status(404)
        .json({ success: false, message: "Village not found." });
    }

    res.status(200).json({ success: true, updatedVillage });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete a village by ID
const deleteVillageById = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedVillage = await Village.findByIdAndDelete(id);

    if (!deletedVillage) {
      return res
        .status(404)
        .json({ success: false, message: "Village not found." });
    }

    res
      .status(200)
      .json({ success: true, message: "Village deleted successfully." });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export {
  createVillage,
  bulkCreateVillages,
  getAllVillages,
  getVillageById,
  updateVillageById,
  deleteVillageById,
};
