const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number, required: true },
  clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  clientName: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['Draft', 'Active', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Active'
  },
  hiredFreelancerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hiredFreelancerName: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Job', jobSchema);