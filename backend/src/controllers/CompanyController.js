const Company = require('../models/Company');

module.exports = {
  // Create an async function
  async createCompany(req, res) {
    try {
      // console.log(req.body)
      // Get name from api call
      const { companyName, ownerId } = req.body;
      if (!companyName || !ownerId) {
        return res.status(200).json({
          message: 'Required information is missing.'
        });
      }
      // Create a new company with await
      const company = await Company.create({
        companyName,
        ownerId
      });
      // Now we populate the Company with an Owner object
      // await company
      //     .populate('owner')
      //     .execPopulate();
      // Respond by sending the company back
      return res.json(company);
    } catch (error) {
      throw Error(`Error while registering a new company : ${error}`);
    }
  },

  // Get a company by ID!
  async getCompanyById(req, res) {
    // Get company ID
    const { company_id } = req.params;
    try {
      const company = await Company.findById(company_id);
      // If visit exists, send the visit
      if (company) {
        return res.json(company);
      }
    } catch (error) {
      return res.status(400).json({message: 'Company Id does not exist!'});
    }
  },

  // Get all of companies
  async getAllCompanies(req, res) {
    // Get company id from URL
    const { company_id } = req.params;
    try {
      // Return all companies from company model
      const company = await Company.find(company_id);
      // If companies exist, return them! 
      if (company) {
        return res.json(company);
      }
    } catch (error) {
      return res.status(400).json({message: 'No comapnies exist.'});
    }
  }
};