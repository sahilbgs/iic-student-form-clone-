// ============================================================================
// GTU-ITR Student Registration App Engine (Cloud Standby & Netlify Edition)
// ============================================================================

window.CURRENT_POST_ID = null;

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }

  detectUrlContext();
  initCountdown();
  initProgressTracker();
  checkPrimaryServerHealth();
});

// ----------------------------------------------------------------------------
// 1. URL CONTEXT DETECTION (POST ID & ACTIVITY TITLE FROM SAME LINK)
// ----------------------------------------------------------------------------
// When the student opens the exact same link (e.g. /posts/12/register),
// this function extracts the activity ID & title dynamically!
function detectUrlContext() {
  const path = window.location.pathname;
  const match = path.match(/\/posts\/(\d+)\/register/i);
  let detectedPostId = null;

  if (match && match[1]) {
    detectedPostId = match[1];
  } else {
    const params = new URLSearchParams(window.location.search);
    if (params.get('post_id')) {
      detectedPostId = params.get('post_id');
    }
  }

  const params = new URLSearchParams(window.location.search);
  const detectedTitle = params.get('title');

  if (detectedPostId) {
    console.log('[Standby Engine] Operating on same registration link for Post ID:', detectedPostId);
    window.CURRENT_POST_ID = detectedPostId;

    const modeBadge = document.getElementById('modeBadge');
    if (modeBadge) {
      modeBadge.textContent = `ACTIVITY #${detectedPostId} (STANDBY CLOUD)`;
    }
    const heroTitle = document.getElementById('displayActivityTitle');
    if (heroTitle && !detectedTitle) {
      heroTitle.textContent = `GTU Activity Registration (ID #${detectedPostId})`;
    }
  }

  if (detectedTitle) {
    const actSelect = document.getElementById('activity_title');
    if (actSelect) {
      let found = false;
      for (let opt of actSelect.options) {
        if (opt.value.toLowerCase() === detectedTitle.toLowerCase()) {
          opt.selected = true;
          found = true;
          break;
        }
      }
      if (!found) {
        const newOpt = new Option(detectedTitle, detectedTitle, true, true);
        actSelect.add(newOpt);
      }
    }
    const heroTitle = document.getElementById('displayActivityTitle');
    if (heroTitle) heroTitle.textContent = detectedTitle;
  }
}

// ----------------------------------------------------------------------------
// 2. PRIMARY SERVER HEALTH MONITOR & STANDBY ACTIVATION
// ----------------------------------------------------------------------------
const PRIMARY_SERVER_URL = 'https://iic-gtu-itr.aceglory.in';

async function checkPrimaryServerHealth() {
  const pulseDot = document.getElementById('serverPulseDot');
  const statusText = document.getElementById('serverStatusText');
  const fallbackNotice = document.getElementById('fallbackNotice');
  const modeBadge = document.getElementById('modeBadge');

  // If already loaded as a fallback on the same domain, check if local origin failed
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${PRIMARY_SERVER_URL}/static/gtu_logo.png?ping=${Date.now()}`, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    // Primary server reachable
    if (pulseDot) pulseDot.className = 'pulse-dot';
    if (statusText) statusText.innerHTML = 'Primary Server: <span style="color:var(--success);font-weight:700;">ONLINE</span>';
    if (fallbackNotice) fallbackNotice.style.display = 'none';
  } catch (err) {
    // Primary server is DOWN / BAND!
    console.warn('[Server Monitor] Primary GTU server is offline / unreachable:', err);
    if (pulseDot) pulseDot.className = 'pulse-dot pulse-dot--danger';
    if (statusText) statusText.innerHTML = 'Primary Server: <span style="color:var(--danger);font-weight:700;">OFFLINE (STANDBY ACTIVE)</span>';
    if (fallbackNotice) fallbackNotice.style.display = 'flex';
    if (modeBadge) {
      modeBadge.textContent = 'EMERGENCY STANDBY ACTIVE';
      modeBadge.className = 'badge badge--warning';
    }
    if (window.lucide) lucide.createIcons();
  }
}

// ----------------------------------------------------------------------------
// 3. LIVE COUNTDOWN TIMER ENGINE
// ----------------------------------------------------------------------------
function initCountdown() {
  const daysEl = document.getElementById('cdDays');
  const hoursEl = document.getElementById('cdHours');
  const minsEl = document.getElementById('cdMinutes');
  const secsEl = document.getElementById('cdSeconds');
  const deadlineText = document.getElementById('deadlineText');

  const now = new Date();
  const targetDate = new Date();
  targetDate.setDate(now.getDate() + 5);
  targetDate.setHours(23, 59, 59, 0);

  if (deadlineText) {
    deadlineText.textContent = `Closes: ${targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at 11:59 PM`;
  }

  function updateTimer() {
    const currentTime = new Date().getTime();
    const distance = targetDate.getTime() - currentTime;

    if (distance <= 0) {
      if (daysEl) daysEl.textContent = '00';
      if (hoursEl) hoursEl.textContent = '00';
      if (minsEl) minsEl.textContent = '00';
      if (secsEl) secsEl.textContent = '00';
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(minutes).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

// ----------------------------------------------------------------------------
// 4. FORM PROGRESS METER TRACKER
// ----------------------------------------------------------------------------
const CORE_FIELDS = [
  'student_name',
  'enrollment_no',
  'email',
  'phone',
  'semester',
  'department',
  'activity_title',
  'privacy_consent'
];

function updateProgress() {
  let filledCount = 0;

  CORE_FIELDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (el.type === 'checkbox') {
      if (el.checked) filledCount++;
    } else if (el.value && el.value.trim().length > 0) {
      filledCount++;
    }
  });

  const total = CORE_FIELDS.length;
  const pct = Math.min(100, Math.round((filledCount / total) * 100));

  const progressBar = document.getElementById('progressBarFill');
  const progressText = document.getElementById('progressText');

  if (progressBar) progressBar.style.width = `${pct}%`;
  if (progressText) progressText.textContent = `${filledCount} of ${total} core items (${pct}%)`;
}

function initProgressTracker() {
  updateProgress();
}

// ----------------------------------------------------------------------------
// 5. SUBMIT REGISTRATION (FIREBASE CLOUD STORAGE + OFFLINE QUEUE)
// ----------------------------------------------------------------------------
async function handleRegistrationSubmit(event) {
  event.preventDefault();

  const btn = document.getElementById('btnSubmitForm');
  const btnText = document.getElementById('btnSubmitText');

  // Input Values
  const studentName = document.getElementById('student_name').value.trim();
  const enrollmentNo = document.getElementById('enrollment_no').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const semester = document.getElementById('semester').value;
  const department = document.getElementById('department').value;
  const activityTitle = document.getElementById('activity_title').value;
  const collegeName = document.getElementById('college_name').value.trim() || 'GTU Affiliated Institute';
  const projectLink = document.getElementById('project_link').value.trim();
  const remarks = document.getElementById('remarks').value.trim();

  // Basic Enrollment Number Sanity Check
  if (enrollmentNo.length < 5) {
    showAlert('Please enter a valid GTU Enrollment Number.', 'danger');
    return;
  }

  // Set loading state
  if (btn) btn.disabled = true;
  if (btnText) btnText.innerHTML = '<span class="spinner"></span> Saving to Cloud...';

  // Generate Unique Registration ID
  const timestamp = new Date();
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const regId = `GTU-REG-${timestamp.getFullYear()}-${randomSuffix}`;

  const registrationData = {
    reg_id: regId,
    post_id: window.CURRENT_POST_ID || null,
    student_name: studentName,
    enrollment_no: enrollmentNo,
    email: email,
    phone: phone,
    semester: semester,
    department: department,
    activity_title: activityTitle,
    college_name: collegeName,
    project_link: projectLink,
    remarks: remarks,
    registered_at: timestamp.toISOString(),
    source: 'same_link_standby_cloud',
    sync_status: 'pending_primary_sync'
  };

  try {
    let savedToFirebase = false;

    // Direct Firestore Save
    if (typeof db !== 'undefined' && db !== null && isFirebaseConfigured()) {
      await db.collection('student_registrations').add({
        ...registrationData,
        firebase_timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      savedToFirebase = true;
      console.log('[Firebase] Successfully saved record to Firestore.');
    } else {
      console.warn('[Firebase] Keys pending in firebase-config.js. Saved to LocalStorage fallback.');
    }

    saveToLocalQueue(registrationData);
    showConfirmationSlip(registrationData, savedToFirebase);

  } catch (error) {
    console.error('[Registration Error]', error);
    saveToLocalQueue(registrationData);
    showConfirmationSlip(registrationData, false);
  } finally {
    if (btn) btn.disabled = false;
    if (btnText) btnText.textContent = 'Submit Registration to Cloud';
  }
}

// ----------------------------------------------------------------------------
// 6. LOCAL STORAGE SAFETY QUEUE
// ----------------------------------------------------------------------------
function saveToLocalQueue(data) {
  try {
    const existing = JSON.parse(localStorage.getItem('gtu_student_registrations') || '[]');
    existing.push(data);
    localStorage.setItem('gtu_student_registrations', JSON.stringify(existing));
  } catch (e) {
    console.error('LocalStorage error:', e);
  }
}

// ----------------------------------------------------------------------------
// 7. CONFIRMATION SLIP PRESENTATION
// ----------------------------------------------------------------------------
function showConfirmationSlip(data, savedToFirebase) {
  document.getElementById('formView').style.display = 'none';
  const successBox = document.getElementById('successBox');
  successBox.style.display = 'block';

  document.getElementById('slipStudentName').textContent = data.student_name;
  document.getElementById('slipActivityTitle').textContent = data.activity_title;
  document.getElementById('slipRegId').textContent = data.reg_id;

  document.getElementById('slipTableStudentName').textContent = data.student_name;
  document.getElementById('slipTableEnrollment').textContent = data.enrollment_no;
  document.getElementById('slipTableEmail').textContent = data.email;
  document.getElementById('slipTablePhone').textContent = data.phone;
  document.getElementById('slipTableDept').textContent = data.department;
  document.getElementById('slipTableSem').textContent = data.semester;
  document.getElementById('slipTableActivity').textContent = data.activity_title;

  const regDateFormatted = new Date(data.registered_at).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
  document.getElementById('slipTableDate').textContent = regDateFormatted;

  const backendStatusEl = document.getElementById('slipTableBackend');
  if (savedToFirebase) {
    backendStatusEl.innerHTML = '<span style="color:var(--success);font-weight:700;">✓ Saved to Google Firebase Cloud</span>';
  } else {
    backendStatusEl.innerHTML = '<span style="color:var(--warning);font-weight:700;">✓ Saved in Standby Queue (Firebase Keys Pending)</span>';
  }

  if (window.lucide) {
    lucide.createIcons();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ----------------------------------------------------------------------------
// 8. RESET FOR NEW ENTRY
// ----------------------------------------------------------------------------
function resetFormForNewEntry() {
  document.getElementById('studentRegForm').reset();
  document.getElementById('successBox').style.display = 'none';
  document.getElementById('formView').style.display = 'block';
  updateProgress();
  if (window.lucide) {
    lucide.createIcons();
  }
}

// ----------------------------------------------------------------------------
// 9. HELPER ALERTS
// ----------------------------------------------------------------------------
function showAlert(message, type = 'warning') {
  const box = document.getElementById('formAlertBox');
  if (!box) return;

  box.style.display = 'flex';
  box.className = `notice-box notice-box--${type}`;
  box.innerHTML = `<i data-lucide="alert-circle" style="width:16px;height:16px;"></i><span>${message}</span>`;
  if (window.lucide) lucide.createIcons();

  setTimeout(() => {
    box.style.display = 'none';
  }, 6000);
}
