const Tag = require("../models/tags");

// create Tag's handler function

exports.createTag = async (req, res) => {
  try {
    //fetch data
    const { name, description } = req.body;
    //validate the data fetched
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        message: "All fields are required ",
      });
    }

    //create entry in DB
    const tagDetails = await Tag.create({
      name: name,
      description: description,
    });
    console.log(tagDetails);

    return res.status(200).json({
      success: true,
      message: "Tag created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

//getAlltags hander function

exports.showAlltags = async (req, res) => {
  try {
    const allTags = await Tag.find({}, { name: true, description: true }); // make sure that Tags have name and description
    return res.status(200).json({
      success: true,
      message: "All tag returned successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
