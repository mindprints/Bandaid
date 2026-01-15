// backend/src/routes/dropbox.ts
// Add these routes to your existing dropbox router

/**
 * GET /api/dropbox/audio/:versionId
 * Get a temporary streaming link for a specific version
 */
router.get('/audio/:versionId', async (req, res) => {
  try {
    const versionId = parseInt(req.params.versionId);

    if (isNaN(versionId)) {
      return res.status(400).json({ error: 'Invalid version ID' });
    }

    const audioLink = await dropboxSyncService.getVersionAudioLink(versionId);

    if (!audioLink) {
      return res.status(404).json({ 
        error: 'Audio file not found or not synced from Dropbox' 
      });
    }

    res.json({ 
      url: audioLink,
      expiresIn: '4 hours'
    });
  } catch (error) {
    console.error('Audio link error:', error);
    res.status(500).json({ 
      error: 'Failed to get audio link',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/dropbox/audio/file
 * Get a temporary link for any file by path (for testing)
 */
router.get('/audio/file', async (req, res) => {
  try {
    const filePath = req.query.path as string;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    const audioLink = await dropboxSyncService.getCachedLink(filePath);

    res.json({ 
      url: audioLink,
      expiresIn: '4 hours'
    });
  } catch (error) {
    console.error('Audio link error:', error);
    res.status(500).json({ 
      error: 'Failed to get audio link',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});