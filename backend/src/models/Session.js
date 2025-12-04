import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    candidateName: {
        type: String,
        required: true
    },
    language: {
        type: String,
        required: true,
        default: 'javascript'
    },
    code: {
        type: String,
        default: ''
    },
    participants: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    endedAt: {
        type: Date,
        default: null
    },
    // Optional: Track code changes over time
    codeHistory: [{
        timestamp: {
            type: Date,
            default: Date.now
        },
        code: String
    }]
}, {
    timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for efficient queries
sessionSchema.index({ createdAt: -1 });
sessionSchema.index({ isActive: 1 });

// Method to end a session
sessionSchema.methods.endSession = function () {
    this.isActive = false;
    this.endedAt = new Date();
    return this.save();
};

// Method to add code to history
sessionSchema.methods.addCodeHistory = function (code) {
    this.codeHistory.push({
        timestamp: new Date(),
        code: code
    });
    // Keep only last 50 entries to avoid bloat
    if (this.codeHistory.length > 50) {
        this.codeHistory = this.codeHistory.slice(-50);
    }
    return this.save();
};

// Static method to get active sessions
sessionSchema.statics.getActiveSessions = function () {
    return this.find({ isActive: true }).sort({ createdAt: -1 });
};

// Static method to get recent sessions
sessionSchema.statics.getRecentSessions = function (limit = 20) {
    return this.find().sort({ createdAt: -1 }).limit(limit);
};

const Session = mongoose.model('Session', sessionSchema);

export default Session;
