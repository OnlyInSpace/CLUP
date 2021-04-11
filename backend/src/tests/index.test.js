const app = require('../testServer.js');
const User = require('../models/User');
const Store = require('../models/Store');
const mongoose = require('mongoose');
const supertest = require('supertest');
require('dotenv').config();

beforeEach((done) => {
  mongoose.connect(process.env.MONGO_DB_TEST, {
       useNewUrlParser: true,
       useUnifiedTopology: true,
       useFindAndModify: false
    },
    () => done());
});

afterEach((done) => {
  mongoose.connection.db.dropDatabase(() => {
    mongoose.connection.close(() => done());
  });
});

// Must have a working access token, need to copy one from the console
const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2MDZiZGQ0M2U2NDc5ZjhiYTRjYWIzY2UiLCJlbWFpbCI6InRlc3QzQHRlc3QuY29tIiwicGhvbmVOdW1iZXIiOiI0MjA0MjA2OTY5IiwiYnVzaW5lc3NfaWQiOiIiLCJyb2xlIjoidXNlciIsImNsb2NrZWRJbiI6ZmFsc2UsImlhdCI6MTYxNzcyMzg4MiwiZXhwIjoxNjE3NzI0NjAyfQ.9U2_R2sHN3R6ZlN0SN7rySbViEDQcsF_nKShxYkHJGU'

describe('Creating and getting a store\'s data', () => {
  test('GET /store/:store_id', async () => {
    const store = await Store.create({ 
      company_id: '6041d51f48dbd9384b04f726', 
      open24hours: true,
      storeName: 'test store',
      location: {
        address1: '2524 Latency St',
        address2: '',
        city: 'Canyon',
        postalCode: '79124',
        state: 'TX,'
      },
      maxOccupants: 100,
      maxPartyAllowed: 4,
      avgVisitLength: 60
    });


    await supertest(app).get('/store/' + store.id)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .then((response) => {
        // Check type 
        expect(typeof(response.body) === "object").toBeTruthy();

        // Check data
        expect(response.body._id).toBe(store.id);
        expect(response.body.storeName).toBe(store.storeName);
        expect(response.body.company_id).toBe(store.company_id);
        expect(response.body.open24hours).toBe(store.open24hours);
        expect(response.body.location).toMatchObject(store.location);
        expect(response.body.maxOccupants).toBe(store.maxOccupants);
        expect(response.body.maxPartyAllowed).toBe(store.maxPartyAllowed);
        expect(response.body.avgVisitLength).toBe(store.avgVisitLength);
      });
  });
});


// email, role, firstName, lastName, store_id, company_id 
describe('Adding an employee to a store and changing their role', () => {
  test('POST /addEmployee', async () => {
    const store = await Store.create({ 
      company_id: '6041d51f48dbd9384b04f726', 
      open24hours: true,
      storeName: 'test store',
      location: {
        address1: '2524 Latency St',
        address2: '',
        city: 'Canyon',
        postalCode: '79124',
        state: 'TX,'
      },
      maxOccupants: 100,
      maxPartyAllowed: 4,
      avgVisitLength: 60
    });

    const user = await User.create({ 
      phoneNumber: 8067303555,
      email: 'plz@test.com',
      password: 'testpassword',
    });

    const data = {
      email: user.email,
      role: 'employee',
      firstName: 'Musa',
      lastName: 'Khan',
      store_id: store.id, 
      company_id: 'x'
    }

    console.log('user:', user.id);
    
    await supertest(app).post('/addEmployee')
      .set('Authorization', `Bearer ${token}`)
      .send(data)
      .expect(200)
      .then((response) => {
        // Check type 
        expect(typeof(response.body) === "object").toBeTruthy();
        console.log('body:', response.body._id);
  
        // Check data
        expect(response.body._id).toBe(user.id);
        expect(response.body.email).toBe(user.email);
        expect(response.body.password).toBe(user.password);
        expect(response.body.role).toBe(data.role);
        expect(response.body.firstName).toBe(data.firstName);
        expect(response.body.lastName).toBe(data.lastName);
        expect(response.body.business_id).toBe(store.id);
      });
  });
});