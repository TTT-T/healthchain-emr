import { Router } from 'express';
import { 
  registerPatientInEMR,
  getPatientByUserId,
  checkPatientRegistration
} from '../controllers/patientRegistrationController';
import { authenticate } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/patient-registration/register:
 *   post:
 *     summary: Register patient in EMR system
 *     description: Creates a patient record with HR number after user registration
 *     tags: [Patient Registration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - firstName
 *               - lastName
 *               - dateOfBirth
 *               - gender
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: User ID from users table
 *               firstName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Patient's first name
 *               lastName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Patient's last name
 *               thaiFirstName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Patient's Thai first name
 *               thaiLastName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Patient's Thai last name
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: Date of birth (YYYY-MM-DD)
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 description: Patient's gender
 *               nationalId:
 *                 type: string
 *                 maxLength: 13
 *                 description: Thai national ID (13 digits)
 *               phone:
 *                 type: string
 *                 maxLength: 20
 *                 description: Phone number
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address
 *               address:
 *                 type: string
 *                 maxLength: 500
 *                 description: Address
 *               bloodType:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *                 description: Blood type
 *               allergies:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Allergies
 *               medicalHistory:
 *                 type: string
 *                 maxLength: 2000
 *                 description: Medical history
 *               currentMedications:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Current medications
 *               chronicDiseases:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Chronic diseases
 *               emergencyContactName:
 *                 type: string
 *                 maxLength: 100
 *                 description: Emergency contact name
 *               emergencyContactPhone:
 *                 type: string
 *                 maxLength: 20
 *                 description: Emergency contact phone
 *               emergencyContactRelation:
 *                 type: string
 *                 maxLength: 50
 *                 description: Emergency contact relation
 *               insuranceType:
 *                 type: string
 *                 maxLength: 50
 *                 description: Insurance type
 *               insuranceNumber:
 *                 type: string
 *                 maxLength: 50
 *                 description: Insurance number
 *               insuranceExpiryDate:
 *                 type: string
 *                 format: date
 *                 description: Insurance expiry date (YYYY-MM-DD)
 *     responses:
 *       201:
 *         description: Patient successfully registered in EMR system
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     patient:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         hospitalNumber:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         thaiFirstName:
 *                           type: string
 *                         thaiLastName:
 *                           type: string
 *                         dateOfBirth:
 *                           type: string
 *                           format: date
 *                         gender:
 *                           type: string
 *                         nationalId:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         email:
 *                           type: string
 *                         address:
 *                           type: string
 *                         bloodType:
 *                           type: string
 *                         allergies:
 *                           type: string
 *                         medicalHistory:
 *                           type: string
 *                         currentMedications:
 *                           type: string
 *                         chronicDiseases:
 *                           type: string
 *                         emergencyContactName:
 *                           type: string
 *                         emergencyContactPhone:
 *                           type: string
 *                         emergencyContactRelation:
 *                           type: string
 *                         insuranceType:
 *                           type: string
 *                         insuranceNumber:
 *                           type: string
 *                         insuranceExpiryDate:
 *                           type: string
 *                           format: date
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: Validation error or user not found
 *       409:
 *         description: Patient already registered
 *       500:
 *         description: Internal server error
 */
router.post('/register', registerPatientInEMR);

/**
 * @swagger
 * /api/patient-registration/check/{userId}:
 *   get:
 *     summary: Check if patient is registered in EMR system
 *     description: Check if a user has been registered as a patient in the EMR system
 *     tags: [Patient Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to check
 *     responses:
 *       200:
 *         description: Patient registration status checked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     isRegistered:
 *                       type: boolean
 *                     patient:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         hospitalNumber:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         registeredAt:
 *                           type: string
 *                           format: date-time
 *       400:
 *         description: User ID is required
 *       500:
 *         description: Internal server error
 */
router.get('/check/:userId', checkPatientRegistration);

/**
 * @swagger
 * /api/patient-registration/patient/{userId}:
 *   get:
 *     summary: Get patient information by user ID
 *     description: Retrieve complete patient information from EMR system
 *     tags: [Patient Registration]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID to get patient information for
 *     responses:
 *       200:
 *         description: Patient information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     patient:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         hospitalNumber:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         thaiFirstName:
 *                           type: string
 *                         thaiLastName:
 *                           type: string
 *                         dateOfBirth:
 *                           type: string
 *                           format: date
 *                         gender:
 *                           type: string
 *                         nationalId:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         email:
 *                           type: string
 *                         address:
 *                           type: string
 *                         bloodType:
 *                           type: string
 *                         allergies:
 *                           type: string
 *                         medicalHistory:
 *                           type: string
 *                         currentMedications:
 *                           type: string
 *                         chronicDiseases:
 *                           type: string
 *                         emergencyContactName:
 *                           type: string
 *                         emergencyContactPhone:
 *                           type: string
 *                         emergencyContactRelation:
 *                           type: string
 *                         insuranceType:
 *                           type: string
 *                         insuranceNumber:
 *                           type: string
 *                         insuranceExpiryDate:
 *                           type: string
 *                           format: date
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                         user:
 *                           type: object
 *                           properties:
 *                             username:
 *                               type: string
 *                             email:
 *                               type: string
 *       404:
 *         description: Patient not found in EMR system
 *       500:
 *         description: Internal server error
 */
router.get('/patient/:userId', getPatientByUserId);

export default router;
