const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all candidates
router.get('/', (req, res) => {
    db.query('SELECT * FROM candidates', (err, result) => {
        if (err) return res.status(500).send(err);
        res.json(result);
    });
});

// Vote
router.post('/vote', (req, res) => {
    const { user_id, candidate_id } = req.body;

    const voteCheck = 'SELECT * FROM votes WHERE user_id = ?';
    db.query(voteCheck, [user_id], (err, result) => {
        if (err) return res.status(500).send(err);
        if (result.length > 0) return res.status(400).send('User has already voted');

        const insertVote = 'INSERT INTO votes (user_id, candidate_id) VALUES (?, ?)';
        const updateCandidate = 'UPDATE candidates SET votes = votes + 1 WHERE id = ?';

        db.query(insertVote, [user_id, candidate_id], (err) => {
            if (err) return res.status(500).send(err);
            db.query(updateCandidate, [candidate_id], (err2) => {
                if (err2) return res.status(500).send(err2);
                res.send('Vote recorded successfully');
            });
        });
    });
});

module.exports = router;
