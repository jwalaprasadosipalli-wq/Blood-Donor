import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Donor = sequelize.define('Donor', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    fullName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    bloodGroup: {
        type: DataTypes.STRING,
        allowNull: false
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    mobile: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true, // Nullable to allow migration with existing records
        unique: true,
        validate: {
            isEmail: true
        }
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    state: {
        type: DataTypes.STRING,
        allowNull: false
    },
    city: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastDonationDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    },
    availability: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    termsAccepted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    },
    otp: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
    }
}, {
    timestamps: true
});

export default Donor;
