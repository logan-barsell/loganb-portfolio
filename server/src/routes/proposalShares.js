const express = require('express');
const {
  getShareByToken,
  acceptShare,
  reviseShare,
  declineShare,
} = require('../services/proposals');
const { proposalShareLimiter, proposalShareActionLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.get('/:token', proposalShareLimiter, (req, res, next) => {
  try {
    const share = getShareByToken(req.params.token);

    res.set('Cache-Control', 'no-store');
    return res.status(200).json({ ok: true, share });
  } catch (error) {
    return next(error);
  }
});

router.post(
  '/:token/accept',
  proposalShareActionLimiter,
  express.json({ limit: '16kb' }),
  async (req, res, next) => {
    try {
      const result = await acceptShare(req.params.token);

      res.set('Cache-Control', 'no-store');
      return res.status(200).json({
        ok: true,
        already: result.already,
        emailSent: result.emailSent,
        share: result.share,
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/:token/revise',
  proposalShareActionLimiter,
  express.json({ limit: '32kb' }),
  async (req, res, next) => {
    try {
      const result = await reviseShare(req.params.token, req.body?.message);

      res.set('Cache-Control', 'no-store');
      return res.status(200).json({
        ok: true,
        emailSent: result.emailSent,
        share: result.share,
      });
    } catch (error) {
      return next(error);
    }
  }
);

router.post(
  '/:token/decline',
  proposalShareActionLimiter,
  express.json({ limit: '32kb' }),
  async (req, res, next) => {
    try {
      const result = await declineShare(req.params.token, req.body?.reason);

      res.set('Cache-Control', 'no-store');
      return res.status(200).json({
        ok: true,
        already: result.already,
        emailSent: result.emailSent,
        share: result.share,
      });
    } catch (error) {
      return next(error);
    }
  }
);

module.exports = router;
