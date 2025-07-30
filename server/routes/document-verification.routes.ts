import { Router } from 'express';
import multer from 'multer';
import { DocumentAuthenticationService } from '../services/DocumentAuthenticationService';
import type { DocumentFile } from '../services/DocumentAuthenticationService';

const router = Router();
const documentService = new DocumentAuthenticationService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/tiff',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type'));
    }
  },
});

/**
 * POST /api/documents/verify
 * Verify document authenticity
 */
router.post('/verify', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No document file provided'
      });
    }

    const documentFile: DocumentFile = {
      id: req.body.documentId || `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file: req.file.buffer,
      name: req.file.originalname,
      size: req.file.size,
      type: req.file.mimetype,
      uploadedAt: new Date()
    };

    const verificationResult = await documentService.verifyDocument(documentFile);

    res.json({
      success: true,
      data: verificationResult
    });

  } catch (error) {
    console.error('Document verification error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Document verification failed'
    });
  }
});

/**
 * GET /api/documents/supported-types
 * Get list of supported document types
 */
router.get('/supported-types', (req, res) => {
  res.json({
    success: true,
    data: {
      types: [
        {
          mimeType: 'application/pdf',
          extensions: ['.pdf'],
          description: 'PDF Documents'
        },
        {
          mimeType: 'image/jpeg',
          extensions: ['.jpg', '.jpeg'],
          description: 'JPEG Images'
        },
        {
          mimeType: 'image/png',
          extensions: ['.png'],
          description: 'PNG Images'
        },
        {
          mimeType: 'image/tiff',
          extensions: ['.tiff', '.tif'],
          description: 'TIFF Images'
        },
        {
          mimeType: 'application/msword',
          extensions: ['.doc'],
          description: 'Microsoft Word Documents'
        },
        {
          mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          extensions: ['.docx'],
          description: 'Microsoft Word Documents (Modern)'
        }
      ],
      maxFileSize: '50MB',
      maxFiles: 10
    }
  });
});

/**
 * POST /api/documents/batch-verify
 * Verify multiple documents at once
 */
router.post('/batch-verify', upload.array('documents', 10), async (req, res) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No document files provided'
      });
    }

    const verificationPromises = req.files.map(async (file, index) => {
      const documentFile: DocumentFile = {
        id: `doc_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        file: file.buffer,
        name: file.originalname,
        size: file.size,
        type: file.mimetype,
        uploadedAt: new Date()
      };

      try {
        return await documentService.verifyDocument(documentFile);
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Verification failed',
          documentName: file.originalname
        };
      }
    });

    const results = await Promise.all(verificationPromises);

    const successful = results.filter(result => !('error' in result));
    const failed = results.filter(result => 'error' in result);

    res.json({
      success: true,
      data: {
        successful,
        failed,
        totalProcessed: results.length,
        successCount: successful.length,
        failureCount: failed.length
      }
    });

  } catch (error) {
    console.error('Batch document verification error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Batch verification failed'
    });
  }
});

export default router;