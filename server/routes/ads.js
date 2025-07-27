const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/auth');
const Ad = require('../models/Ad');

// @route   GET /api/ads/:placement
// @desc    Get ads for a specific placement
// @access  Public
router.get('/:placement', optionalAuth, async (req, res) => {
  try {
    const { placement } = req.params;
    const { limit = 3 } = req.query;
    
    // Get user's country from IP (simplified - in production use a GeoIP service)
    const country = req.headers['cf-ipcountry'] || 'US'; // Cloudflare header or default
    
    // Get device type from user agent (simplified)
    const userAgent = req.headers['user-agent'] || '';
    let deviceType = 'desktop';
    if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
      deviceType = /iPad/.test(userAgent) ? 'tablet' : 'mobile';
    }

    const ads = await Ad.getAdsForPlacement(
      placement, 
      req.user, 
      country, 
      deviceType, 
      parseInt(limit)
    );

    // Log impressions for each ad
    const adsWithMetrics = await Promise.all(
      ads.map(async (ad) => {
        await ad.logImpression(
          req.user?._id, 
          placement, 
          userAgent, 
          req.ip, 
          country
        );

        return {
          _id: ad._id,
          type: ad.type,
          placement: ad.placement,
          content: ad.content,
          priority: ad.priority
        };
      })
    );

    res.json({
      success: true,
      data: adsWithMetrics
    });

  } catch (error) {
    console.error('Get ads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ads'
    });
  }
});

// @route   POST /api/ads/:id/click
// @desc    Track ad click
// @access  Public
router.post('/:id/click', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { placement } = req.body;

    const ad = await Ad.findById(id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: 'Ad not found'
      });
    }

    // Get user info
    const country = req.headers['cf-ipcountry'] || 'US';
    const userAgent = req.headers['user-agent'] || '';

    // Log click
    await ad.logClick(
      req.user?._id,
      placement,
      userAgent,
      req.ip,
      country
    );

    // Return click URL for redirect
    let clickUrl = '';
    if (ad.type === 'banner' && ad.content.banner) {
      clickUrl = ad.content.banner.clickUrl;
    } else if (ad.type === 'video' && ad.content.video) {
      clickUrl = ad.content.video.clickUrl;
    } else if (ad.type === 'native' && ad.content.native) {
      clickUrl = ad.content.native.clickUrl;
    }

    res.json({
      success: true,
      message: 'Click tracked successfully',
      data: {
        clickUrl
      }
    });

  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking click'
    });
  }
});

// @route   GET /api/ads/public/script
// @desc    Get ad serving script (for external websites)
// @access  Public
router.get('/public/script', (req, res) => {
  const { siteId, placement, width = 300, height = 250 } = req.query;
  
  // Generate ad serving JavaScript
  const adScript = `
(function() {
  var adContainer = document.createElement('div');
  adContainer.id = 'studify-ad-${placement}-${Date.now()}';
  adContainer.style.width = '${width}px';
  adContainer.style.height = '${height}px';
  adContainer.style.position = 'relative';
  adContainer.style.overflow = 'hidden';
  
  // Insert ad container into current script location
  var currentScript = document.currentScript || (function() {
    var scripts = document.getElementsByTagName('script');
    return scripts[scripts.length - 1];
  })();
  currentScript.parentNode.insertBefore(adContainer, currentScript);
  
  // Fetch and display ad
  fetch('${req.protocol}://${req.get('host')}/api/ads/${placement}?limit=1&siteId=${siteId}')
    .then(response => response.json())
    .then(data => {
      if (data.success && data.data.length > 0) {
        var ad = data.data[0];
        var adHtml = '';
        
        if (ad.type === 'banner' && ad.content.banner) {
          adHtml = '<a href="#" onclick="trackAdClick(\\''+ad._id+'\\', \\'${placement}\\'); return false;" target="_blank">' +
                   '<img src="'+ad.content.banner.image.url+'" alt="'+ad.content.banner.altText+'" style="width:100%;height:100%;object-fit:cover;" />' +
                   '</a>';
        } else if (ad.type === 'native' && ad.content.native) {
          adHtml = '<div style="padding:10px;border:1px solid #ddd;font-family:Arial,sans-serif;">' +
                   '<h4 style="margin:0 0 5px 0;font-size:14px;">'+ad.content.native.headline+'</h4>' +
                   '<p style="margin:0 0 10px 0;font-size:12px;color:#666;">'+ad.content.native.description+'</p>' +
                   '<a href="#" onclick="trackAdClick(\\''+ad._id+'\\', \\'${placement}\\'); return false;" style="background:#007cba;color:white;padding:5px 10px;text-decoration:none;font-size:12px;">'+ad.content.native.callToAction+'</a>' +
                   '</div>';
        }
        
        adContainer.innerHTML = adHtml;
        
        // Add click tracking function
        window.trackAdClick = function(adId, placement) {
          fetch('${req.protocol}://${req.get('host')}/api/ads/'+adId+'/click', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({placement: placement})
          }).then(response => response.json())
            .then(data => {
              if (data.success && data.data.clickUrl) {
                window.open(data.data.clickUrl, '_blank');
              }
            });
        };
      }
    })
    .catch(error => console.log('Ad loading error:', error));
})();
  `;

  res.setHeader('Content-Type', 'application/javascript');
  res.send(adScript);
});

// @route   GET /api/ads/metrics/summary
// @desc    Get ad metrics summary (for admin)
// @access  Public (simplified for demo)
router.get('/metrics/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateQuery = {};
    if (startDate && endDate) {
      dateQuery = {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const metrics = await Ad.aggregate([
      { $match: { ...dateQuery, isActive: true } },
      {
        $group: {
          _id: null,
          totalAds: { $sum: 1 },
          totalImpressions: { $sum: '$metrics.impressions' },
          totalClicks: { $sum: '$metrics.clicks' },
          totalRevenue: { $sum: '$metrics.revenue' }
        }
      }
    ]);

    const placementMetrics = await Ad.aggregate([
      { $match: { ...dateQuery, isActive: true } },
      {
        $group: {
          _id: '$placement',
          impressions: { $sum: '$metrics.impressions' },
          clicks: { $sum: '$metrics.clicks' },
          revenue: { $sum: '$metrics.revenue' }
        }
      }
    ]);

    const topAds = await Ad.find({ isActive: true })
      .sort({ 'metrics.clicks': -1 })
      .limit(5)
      .select('title metrics placement advertiser.name');

    res.json({
      success: true,
      data: {
        overall: metrics[0] || {
          totalAds: 0,
          totalImpressions: 0,
          totalClicks: 0,
          totalRevenue: 0
        },
        byPlacement: placementMetrics,
        topPerforming: topAds
      }
    });

  } catch (error) {
    console.error('Get ad metrics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ad metrics'
    });
  }
});

// @route   POST /api/ads/submit
// @desc    Submit ad for approval (for advertisers)
// @access  Public
router.post('/submit', async (req, res) => {
  try {
    const adData = {
      ...req.body,
      status: 'pending',
      isActive: false
    };

    const ad = new Ad(adData);
    await ad.save();

    res.status(201).json({
      success: true,
      message: 'Ad submitted for review. You will be notified once approved.',
      data: {
        id: ad._id,
        status: ad.status
      }
    });

  } catch (error) {
    console.error('Submit ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting ad'
    });
  }
});

module.exports = router;