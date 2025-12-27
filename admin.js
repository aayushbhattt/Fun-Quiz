// Admin dashboard script - Updated for local images
import { db } from './firebase-config.js';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  setDoc,
  getDoc,
  updateDoc 
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// DOM elements
const logoutBtn = document.getElementById('logoutBtn');
const totalQuestionsEl = document.getElementById('totalQuestions');
const totalParticipantsEl = document.getElementById('totalParticipants');
const avgScoreEl = document.getElementById('avgScore');
const quizStatus = document.getElementById('quizStatus');
const currentQuestionSelect = document.getElementById('currentQuestionSelect');
const setQuestionBtn = document.getElementById('setQuestionBtn');
const startQuizBtn = document.getElementById('startQuizBtn');
const endQuizBtn = document.getElementById('endQuizBtn');
const addQuestionBtn = document.getElementById('addQuestionBtn');
const questionsList = document.getElementById('questionsList');
const questionModal = document.getElementById('questionModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const questionForm = document.getElementById('questionForm');
const imageFilenameInput = document.getElementById('imageFilename');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const questionTextInput = document.getElementById('questionText');
const correctAnswerInput = document.getElementById('correctAnswer');
const questionOrderInput = document.getElementById('questionOrder');
const saveQuestionBtn = document.getElementById('saveQuestionBtn');
const modalTitle = document.getElementById('modalTitle');

// State
let questions = [];
let editingQuestionId = null;

// Initialize
initializeQuizSettings();
loadStatistics();
loadQuestions();
loadQuizStatus();

// Initialize quiz settings if not exists
async function initializeQuizSettings() {
  try {
    const settingsRef = doc(db, 'quizSettings', 'current');
    const settingsDoc = await getDoc(settingsRef);
    
    if (!settingsDoc.exists()) {
      await setDoc(settingsRef, {
        isActive: false,
        currentQuestion: 0,
        createdAt: new Date()
      });
      console.log('Quiz settings initialized');
    }
  } catch (error) {
    console.error('Error initializing quiz settings:', error);
  }
}

// Load quiz status
async function loadQuizStatus() {
  try {
    const settingsRef = doc(db, 'quizSettings', 'current');
    const settingsDoc = await getDoc(settingsRef);
    
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      updateQuizStatusDisplay(data.isActive, data.currentQuestion, data.isEnded);
    }
  } catch (error) {
    console.error('Error loading quiz status:', error);
  }
}

// Update quiz status display
function updateQuizStatusDisplay(isActive, currentQuestion, isEnded = false) {
  if (isEnded) {
    quizStatus.innerHTML = '🏁 <span style="color: #805ad5;">Ended - Results Shown</span>';
    quizStatus.style.background = '#e9d8fd';
  } else if (isActive) {
    quizStatus.innerHTML = '🟢 <span style="color: var(--success-color);">Active</span>';
    quizStatus.style.background = '#c6f6d5';
  } else {
    quizStatus.innerHTML = '🔴 <span style="color: var(--accent-color);">Stopped</span>';
    quizStatus.style.background = '#fed7d7';
  }
  currentQuestionSelect.value = currentQuestion;
}

// Start quiz
startQuizBtn.addEventListener('click', async () => {
  try {
    const settingsRef = doc(db, 'quizSettings', 'current');
    
    // Create new session ID to reset all users
    const sessionId = Date.now().toString();
    
    await setDoc(settingsRef, {
      isActive: true,
      isEnded: false,
      currentQuestion: parseInt(currentQuestionSelect.value) || 0,
      sessionId: sessionId,
      startedAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });
    
    await loadQuizStatus();
  } catch (error) {
    console.error('Error starting quiz:', error);
    alert('Error starting quiz. Please try again.');
  }
});

// End quiz and show results
endQuizBtn.addEventListener('click', async () => {
  if (!confirm('End quiz and show final results to all users?')) return;
  
  try {
    const settingsRef = doc(db, 'quizSettings', 'current');
    await setDoc(settingsRef, {
      isActive: false,
      isEnded: true,
      currentQuestion: 0,
      endedAt: new Date(),
      updatedAt: new Date()
    }, { merge: true });
    
    await loadQuizStatus();
  } catch (error) {
    console.error('Error ending quiz:', error);
    alert('Error ending quiz. Please try again.');
  }
});

// Set current question
setQuestionBtn.addEventListener('click', async () => {
  try {
    const questionNum = parseInt(currentQuestionSelect.value);
    const settingsRef = doc(db, 'quizSettings', 'current');
    
    await setDoc(settingsRef, {
      currentQuestion: questionNum,
      updatedAt: new Date()
    }, { merge: true });
    
    await loadQuizStatus();
  } catch (error) {
    console.error('Error setting question:', error);
    alert('Error setting question. Please try again.');
  }
});

// Logout
logoutBtn.addEventListener('click', () => {
  sessionStorage.clear();
  window.location.href = 'index.html';
});

// Load statistics
async function loadStatistics() {
  try {
    const questionsSnapshot = await getDocs(collection(db, 'quizQuestions'));
    totalQuestionsEl.textContent = questionsSnapshot.size;
    
    const usersSnapshot = await getDocs(collection(db, 'users'));
    let totalScore = 0;
    
    usersSnapshot.forEach(doc => {
      const data = doc.data();
      totalScore += data.totalPoints || 0;
    });
    
    totalParticipantsEl.textContent = usersSnapshot.size;
    avgScoreEl.textContent = usersSnapshot.size > 0 
      ? Math.round(totalScore / usersSnapshot.size) 
      : 0;
  } catch (error) {
    console.error('Error loading statistics:', error);
    totalQuestionsEl.textContent = '0';
    totalParticipantsEl.textContent = '0';
    avgScoreEl.textContent = '0';
  }
}

// Load questions
async function loadQuestions() {
  try {
    const q = query(collection(db, 'quizQuestions'), orderBy('order', 'asc'));
    const querySnapshot = await getDocs(q);
    
    questions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    updateQuestionSelector();
    displayQuestions();
  } catch (error) {
    console.error('Error loading questions:', error);
    questions = [];
    updateQuestionSelector();
    displayQuestions();
  }
}

// Update question selector dropdown
function updateQuestionSelector() {
  let options = '<option value="0">No Question Active</option>';
  questions.forEach(q => {
    options += `<option value="${q.order}">Question ${q.order}</option>`;
  });
  currentQuestionSelect.innerHTML = options;
}

// Display questions
function displayQuestions() {
  if (questions.length === 0) {
    questionsList.innerHTML = `
      <div class="card" style="text-align: center; padding: 3rem;">
        <div style="font-size: 3rem; margin-bottom: 1rem;">📝</div>
        <h3>No Questions Yet</h3>
        <p style="color: var(--text-muted);">Click "Add New Question" to create your first quiz question!</p>
      </div>
    `;
    return;
  }
  
  let html = '';
  questions.forEach(question => {
    html += `
      <div class="question-item">
        <img src="${question.imageUrl}" alt="Question ${question.order}" class="question-thumbnail">
        <div class="question-info">
          <h3>Question ${question.order}</h3>
          <p style="margin: 0.25rem 0; color: var(--text-dark); font-weight: 500;">
            ${question.questionText || 'No question text'}
          </p>
          <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">
            Answer: <strong style="color: var(--primary-color);">${question.correctAnswer}</strong>
          </p>
        </div>
        <div class="question-actions">
          <button class="btn btn-secondary btn-small edit-btn" data-id="${question.id}">
            ✏️ Edit
          </button>
          <button class="btn btn-danger btn-small delete-btn" data-id="${question.id}">
            🗑️ Delete
          </button>
        </div>
      </div>
    `;
  });
  
  questionsList.innerHTML = html;
  
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => editQuestion(btn.dataset.id));
  });
  
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteQuestion(btn.dataset.id));
  });
}

// Open modal for adding question
addQuestionBtn.addEventListener('click', () => {
  editingQuestionId = null;
  modalTitle.textContent = 'Add New Question';
  questionForm.reset();
  imagePreview.classList.add('hidden');
  
  const maxOrder = questions.length > 0 
    ? Math.max(...questions.map(q => q.order)) 
    : 0;
  questionOrderInput.value = maxOrder + 1;
  
  questionModal.classList.add('active');
});

// Edit question
function editQuestion(questionId) {
  const question = questions.find(q => q.id === questionId);
  if (!question) return;
  
  editingQuestionId = questionId;
  modalTitle.textContent = 'Edit Question';
  
  // Extract filename from imageUrl (images/filename.jpg -> filename.jpg)
  const filename = question.imageUrl.replace('images/', '');
  imageFilenameInput.value = filename;
  questionTextInput.value = question.questionText || '';
  correctAnswerInput.value = question.correctAnswer;
  questionOrderInput.value = question.order;
  previewImg.src = question.imageUrl;
  imagePreview.classList.remove('hidden');
  
  questionModal.classList.add('active');
}

// Delete question
async function deleteQuestion(questionId) {
  if (!confirm('Are you sure you want to delete this question?')) return;
  
  try {
    await deleteDoc(doc(db, 'quizQuestions', questionId));
    await loadQuestions();
    await loadStatistics();
  } catch (error) {
    console.error('Error deleting question:', error);
    alert('Error deleting question. Please try again.');
  }
}

// Close modal
closeModal.addEventListener('click', () => {
  questionModal.classList.remove('active');
});

cancelBtn.addEventListener('click', () => {
  questionModal.classList.remove('active');
});

// Image preview on filename input
imageFilenameInput.addEventListener('input', (e) => {
  const filename = e.target.value.trim();
  if (filename) {
    const imageUrl = `images/${filename}`;
    previewImg.src = imageUrl;
    imagePreview.classList.remove('hidden');
    
    // Check if image exists
    previewImg.onerror = () => {
      imagePreview.classList.add('hidden');
    };
  } else {
    imagePreview.classList.add('hidden');
  }
});

// Submit question form
questionForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const filename = imageFilenameInput.value.trim();
  const questionText = questionTextInput.value.trim();
  const correctAnswer = correctAnswerInput.value.trim();
  const order = parseInt(questionOrderInput.value);
  
  if (!filename) {
    alert('Please enter an image filename');
    return;
  }
  
  try {
    saveQuestionBtn.disabled = true;
    saveQuestionBtn.textContent = 'Saving...';
    
    const imageUrl = `images/${filename}`;
    
    if (editingQuestionId) {
      // Update existing question
      await updateDoc(doc(db, 'quizQuestions', editingQuestionId), {
        imageUrl,
        questionText,
        correctAnswer,
        order,
        updatedAt: new Date()
      });
    } else {
      // Add new question
      await addDoc(collection(db, 'quizQuestions'), {
        imageUrl,
        questionText,
        correctAnswer,
        order,
        createdAt: new Date()
      });
    }
    
    await loadQuestions();
    await loadStatistics();
    
    questionModal.classList.remove('active');
    questionForm.reset();
    saveQuestionBtn.disabled = false;
    saveQuestionBtn.textContent = 'Save Question';
  } catch (error) {
    console.error('Error saving question:', error);
    alert('Error saving question. Please try again.');
    saveQuestionBtn.disabled = false;
    saveQuestionBtn.textContent = 'Save Question';
  }
});

// Close modal on outside click
questionModal.addEventListener('click', (e) => {
  if (e.target === questionModal) {
    questionModal.classList.remove('active');
  }
});
