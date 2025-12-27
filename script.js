// Main script for landing page
import { db } from './firebase-config.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const startForm = document.getElementById('startForm');
const uniqueIdInput = document.getElementById('uniqueId');
const displayNameInput = document.getElementById('displayName');
const errorMessage = document.getElementById('errorMessage');

// Handle form submission
startForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const uniqueId = uniqueIdInput.value.trim();
  const displayName = displayNameInput.value.trim();
  
  // Validate inputs
  if (!uniqueId || !displayName) {
    showError('Please fill in both fields');
    return;
  }
  
  // Check if admin
  if (uniqueId === 'admin@123') {
    // Redirect to admin dashboard
    window.location.href = 'admin-dashboard.html';
    return;
  }
  
  // Store user info in session storage
  sessionStorage.setItem('uniqueId', uniqueId);
  sessionStorage.setItem('displayName', displayName);
  
  // Check if quiz has questions
  try {
    const questionsSnapshot = await getDocs(collection(db, 'quizQuestions'));
    if (questionsSnapshot.empty) {
      showError('No quiz questions available yet. Please contact the admin.');
      return;
    }
    
    // Redirect to quiz page
    window.location.href = 'quiz.html';
  } catch (error) {
    console.error('Error checking questions:', error);
    showError('Error loading quiz. Please try again.');
  }
});

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove('hidden');
  setTimeout(() => {
    errorMessage.classList.add('hidden');
  }, 5000);
}
