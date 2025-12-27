// Results page script - Updated to use users collection
import { db } from './firebase-config.js';
import { collection, getDocs, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Get user info
const uniqueId = sessionStorage.getItem('uniqueId');
const displayName = sessionStorage.getItem('displayName');

if (!uniqueId || !displayName) {
  window.location.href = 'index.html';
}

// DOM elements
const displayNameResult = document.getElementById('displayNameResult');
const userRank = document.getElementById('userRank');
const scoreValue = document.getElementById('scoreValue');
const leaderboardList = document.getElementById('leaderboardList');
const retakeBtn = document.getElementById('retakeBtn');

// Initialize
displayNameResult.textContent = displayName;

// Check if quiz has restarted (new session)
async function checkQuizSession() {
  try {
    const settingsRef = doc(db, 'quizSettings', 'current');
    const settingsSnapshot = await getDoc(settingsRef);
    
    if (settingsSnapshot.exists()) {
      const settings = settingsSnapshot.data();
      
      // If quiz is active and not ended, redirect to quiz
      if (settings.isActive && !settings.isEnded) {
        window.location.href = 'quiz.html';
        return;
      }
    }
  } catch (error) {
    console.error('Error checking session:', error);
  }
}

checkQuizSession();

// Load leaderboard
async function loadLeaderboard() {
  try {
    // Get all users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    const leaderboard = [];
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      leaderboard.push({
        uniqueId: data.uniqueId,
        displayName: data.displayName,
        score: data.totalPoints || 0
      });
    });
    
    // Sort by score (descending)
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Display leaderboard
    displayLeaderboard(leaderboard);
    
    // Find current user's rank and score
    const userIndex = leaderboard.findIndex(u => u.uniqueId === uniqueId);
    if (userIndex >= 0) {
      const userScore = leaderboard[userIndex].score;
      const rank = userIndex + 1;
      
      scoreValue.textContent = userScore;
      userRank.textContent = `Rank: #${rank}`;
      
      // Animate score
      animateScore(userScore);
    } else {
      scoreValue.textContent = '0';
      userRank.textContent = 'Not Ranked';
    }
  } catch (error) {
    console.error('Error loading leaderboard:', error);
    leaderboardList.innerHTML = '<p style="text-align: center; color: var(--accent-color);">Error loading leaderboard</p>';
  }
}

// Display leaderboard
function displayLeaderboard(leaderboard) {
  if (leaderboard.length === 0) {
    leaderboardList.innerHTML = '<p style="text-align: center; color: var(--text-muted);">No scores yet!</p>';
    return;
  }
  
  let html = '';
  leaderboard.forEach((user, index) => {
    const rank = index + 1;
    const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '';
    const isCurrentUser = user.uniqueId === uniqueId;
    const highlightClass = isCurrentUser ? 'style="background: #fef3c7; border-radius: var(--radius-sm);"' : '';
    
    html += `
      <div class="leaderboard-item" ${highlightClass}>
        <div class="leaderboard-rank">${medal || rank}</div>
        <div>
          <div class="leaderboard-name">${user.displayName} ${isCurrentUser ? '(You)' : ''}</div>
        </div>
        <div class="leaderboard-score">${user.score}</div>
      </div>
    `;
  });
  
  leaderboardList.innerHTML = html;
}

// Animate score
function animateScore(targetScore) {
  let currentScore = 0;
  const duration = 1500;
  const increment = targetScore / (duration / 16);
  
  function animate() {
    currentScore += increment;
    if (currentScore < targetScore) {
      scoreValue.textContent = Math.floor(currentScore);
      requestAnimationFrame(animate);
    } else {
      scoreValue.textContent = targetScore;
    }
  }
  
  animate();
}

// Retake quiz
retakeBtn.addEventListener('click', () => {
  window.location.href = 'index.html';
});

// Load leaderboard on page load
loadLeaderboard();
