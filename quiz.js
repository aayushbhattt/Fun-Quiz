// Quiz page script - Simplified with inline leaderboard
import { db } from './firebase-config.js';
import { 
  doc, 
  getDoc, 
  onSnapshot, 
  setDoc,
  collection,
  getDocs 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// Check if user is logged in
const uniqueId = sessionStorage.getItem('uniqueId');
const displayName = sessionStorage.getItem('displayName');

if (!uniqueId || !displayName) {
  window.location.href = 'index.html';
}

// DOM elements
const displayNameHeader = document.getElementById('displayNameHeader');
const currentQuestionEl = document.getElementById('currentQuestion');
const questionNumber = document.getElementById('questionNumber');
const questionText = document.getElementById('questionText');
const questionImage = document.getElementById('questionImage');
const answerInput = document.getElementById('answerInput');
const submitBtn = document.getElementById('submitBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const questionContent = document.getElementById('questionContent');
const waitingScreen = document.getElementById('waitingScreen');
const leaderboardList = document.getElementById('leaderboardList');

// State
let currentQuestion = null;
let quizSettings = null;
let userDoc = null;

// Initialize
displayNameHeader.textContent = displayName;
initializeUser();
loadLeaderboard();

// Refresh leaderboard every 5 seconds
setInterval(loadLeaderboard, 5000);

// Initialize user document
async function initializeUser() {
  try {
    const userRef = doc(db, 'users', uniqueId);
    const userSnapshot = await getDoc(userRef);
    
    // Get current quiz session
    const settingsRef = doc(db, 'quizSettings', 'current');
    const settingsSnapshot = await getDoc(settingsRef);
    const currentSessionId = settingsSnapshot.exists() && settingsSnapshot.data().sessionId 
      ? settingsSnapshot.data().sessionId 
      : 'default-session';
    
    if (!userSnapshot.exists()) {
      // Create new user document
      await setDoc(userRef, {
        uniqueId: uniqueId,
        displayName: displayName,
        totalPoints: 0,
        answeredQuestions: {},
        sessionId: currentSessionId,
        createdAt: new Date()
      });
    } else {
      // Check if session has changed (quiz restarted)
      const userData = userSnapshot.data();
      if (userData.sessionId !== currentSessionId) {
        // Reset user data for new session
        await setDoc(userRef, {
          uniqueId: uniqueId,
          displayName: displayName,
          totalPoints: 0,
          answeredQuestions: {},
          sessionId: currentSessionId,
          createdAt: new Date()
        });
      }
    }
    
    userDoc = (await getDoc(userRef)).data();
  } catch (error) {
    console.error('Error initializing user:', error);
  }
}

// Load leaderboard
async function loadLeaderboard() {
  try {
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
  } catch (error) {
    console.error('Error loading leaderboard:', error);
  }
}

// Display leaderboard
function displayLeaderboard(leaderboard) {
  if (leaderboard.length === 0) {
    leaderboardList.innerHTML = '<p style="text-align: center; color: var(--text-muted); font-size: 0.9rem;">No participants yet</p>';
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

// Listen to quiz settings changes in real-time
const settingsRef = doc(db, 'quizSettings', 'current');
onSnapshot(settingsRef, async (snapshot) => {
  if (snapshot.exists()) {
    quizSettings = snapshot.data();
    
    // Check if quiz has ended - show final results
    if (quizSettings.isEnded) {
      window.location.href = 'results.html';
      return;
    }
    
    await loadCurrentQuestion();
  } else {
    showWaitingScreen('Quiz not started yet. Please wait for the admin to start the quiz.');
  }
});

// Load current question
async function loadCurrentQuestion() {
  try {
    if (!quizSettings.isActive || quizSettings.currentQuestion === 0) {
      showWaitingScreen('Waiting for next question...');
      return;
    }
    
    // Get all questions to find the current one
    const questionsRef = collection(db, 'quizQuestions');
    const questionsSnapshot = await getDocs(questionsRef);
    
    const questions = [];
    questionsSnapshot.forEach(doc => {
      questions.push({ id: doc.id, ...doc.data() });
    });
    
    // Find question with matching order
    currentQuestion = questions.find(q => q.order === quizSettings.currentQuestion);
    
    if (currentQuestion) {
      displayQuestion();
    } else {
      showWaitingScreen('Question not found. Please wait...');
    }
  } catch (error) {
    console.error('Error loading question:', error);
    showWaitingScreen('Error loading question. Please refresh the page.');
  }
}

// Display current question
async function displayQuestion() {
  loadingSpinner.classList.add('hidden');
  waitingScreen.classList.add('hidden');
  questionContent.classList.remove('hidden');
  
  questionNumber.textContent = `Question ${currentQuestion.order}`;
  questionText.textContent = currentQuestion.questionText || 'What is shown in this image?';
  questionImage.src = currentQuestion.imageUrl;
  currentQuestionEl.textContent = currentQuestion.order;
  
  // Refresh user data
  const userRef = doc(db, 'users', uniqueId);
  userDoc = (await getDoc(userRef)).data();
  
  // Check if user already answered this question
  const questionKey = `q${currentQuestion.order}`;
  if (userDoc && userDoc.answeredQuestions && userDoc.answeredQuestions[questionKey]) {
    // Already answered - just show the answer and disable
    answerInput.value = userDoc.answeredQuestions[questionKey].userAnswer;
    answerInput.disabled = true;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Already Answered ✓';
    submitBtn.style.opacity = '0.6';
  } else {
    // Not answered yet
    answerInput.value = '';
    answerInput.disabled = false;
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Answer ✓';
    submitBtn.style.opacity = '1';
    answerInput.focus();
  }
}

// Show waiting screen
function showWaitingScreen(message) {
  loadingSpinner.classList.add('hidden');
  questionContent.classList.add('hidden');
  waitingScreen.classList.remove('hidden');
  document.getElementById('waitingMessage').textContent = message;
}

// Handle answer submission
submitBtn.addEventListener('click', async () => {
  const answer = answerInput.value.trim();
  
  if (!answer) {
    alert('Please enter an answer before submitting.');
    return;
  }
  
  if (!currentQuestion) return;
  
  // Check if already answered
  const questionKey = `q${currentQuestion.order}`;
  if (userDoc && userDoc.answeredQuestions && userDoc.answeredQuestions[questionKey]) {
    alert('You have already answered this question!');
    return;
  }
  
  try {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner spinner-small"></div>';
    
    const isCorrect = answer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
    const pointsEarned = isCorrect ? 10 : 0;
    
    // Update user document
    const userRef = doc(db, 'users', uniqueId);
    const updatedAnswers = {
      ...(userDoc?.answeredQuestions || {}),
      [questionKey]: {
        questionId: currentQuestion.id,
        questionOrder: currentQuestion.order,
        userAnswer: answer,
        correctAnswer: currentQuestion.correctAnswer,
        isCorrect: isCorrect,
        pointsEarned: pointsEarned,
        answeredAt: new Date()
      }
    };
    
    await setDoc(userRef, {
      answeredQuestions: updatedAnswers,
      totalPoints: (userDoc.totalPoints || 0) + pointsEarned,
      lastAnsweredAt: new Date()
    }, { merge: true });
    
    // Refresh leaderboard immediately
    await loadLeaderboard();
    
    // Show feedback - correct or wrong
    const feedbackDiv = document.createElement('div');
    feedbackDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      padding: 2rem 3rem;
      border-radius: var(--radius-lg);
      font-size: 1.5rem;
      font-weight: 700;
      text-align: center;
      z-index: 9999;
      animation: fadeInUp 0.3s ease-out;
      box-shadow: var(--shadow-lg);
    `;
    
    if (isCorrect) {
      feedbackDiv.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      feedbackDiv.style.color = 'white';
      feedbackDiv.innerHTML = '✅ Correct!<br><span style="font-size: 1rem; font-weight: 500;">+10 points</span>';
    } else {
      feedbackDiv.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      feedbackDiv.style.color = 'white';
      feedbackDiv.innerHTML = `❌ Wrong!<br><span style="font-size: 1rem; font-weight: 500;">Correct answer: ${currentQuestion.correctAnswer}</span>`;
    }
    
    document.body.appendChild(feedbackDiv);
    
    // After 3 seconds, remove feedback and show "Already Answered"
    setTimeout(() => {
      feedbackDiv.remove();
      displayQuestion(); // Refresh to show "Already Answered"
    }, 3000);
    
  } catch (error) {
    console.error('Error submitting answer:', error);
    alert('Error submitting answer. Please try again.');
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit Answer ✓';
  }
});

// Allow Enter key to submit answer
answerInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter' && !submitBtn.disabled) {
    submitBtn.click();
  }
});
