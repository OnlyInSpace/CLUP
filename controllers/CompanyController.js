const Company = require('../models/Company');

module.exports = {
  // Create an async function
  async createCompany(req, res) {
    try {
      // console.log(req.body)
      // Get name from api call
      const { companyName, ownerId } = req.body;
      if (!companyName || !ownerId) {
        return res.json({message: 'Please enter your company\'s name.'});
      }

      // Create a new company with await
      const company = await Company.create({
        companyName,
        ownerId
      });

      return res.status(200).json(company);
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },

  // Get a company by ID!
  async getCompanyByUserId(req, res) {
    try {
      // Get company ID
      const { user_id } = req.params;
      const company = await Company.findOne({ ownerId: user_id });

      if (company) {
        return res.status(200).json(company);
      }

    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  },

  // Get all of companies - for development purposes
  async getAllCompanies(req, res) {
    try {
      // Get company id from URL
      const { company_id } = req.params;
      // Return all companies from company model
      const companies = await Company.find(company_id);
      // If companies exist, return them! 
      if (companies) {
        return res.json(companies);
      }
    } catch (error) {
      return res.status(500).json({ error: error.toString() });    
    }
  }
};