const searchBox = document.getElementById("search-box");
const resultsDiv = document.getElementById("results");
const bookList = document.getElementById("book-list");
const myBooks = document.getElementById("my-books");
const showListBtn = document.getElementById("show-list-btn");

const modal = new bootstrap.Modal(document.getElementById('bookModal'));
let selectedIndex = null;
const BASE_URL = "https://bookshelf-your-personal-library-backend.onrender.com";  // backend URL - change if needed

// Load books from backend for logged in user
async function loadMyBooks() {
  if (document.getElementById("my-books").style.display === "none") return;

  bookList.innerHTML = "";

  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not logged in');

    const res = await fetch(`${BASE_URL}/api/books/mybooks`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Failed to fetch books');
    const books = await res.json();

    if (books.length === 0) {
      const li = document.createElement("li");
      li.className = "list-group-item text-center text-light";
      li.innerText = "📭 Your book list is empty.";
      bookList.appendChild(li);
      return;
    }

    books.forEach((book, index) => {
      const li = document.createElement("li");
      li.className = "list-group-item text-white d-flex justify-content-between align-items-center";
      li.innerHTML = `
        <div>
          <strong>${book.title}</strong><br />
          <small>Status: ${book.status || "To Read"}</small>
        </div>
        <i class="bi bi-pencil-square fs-5" role="button" onclick="openModal(${index})"></i>
      `;
      bookList.appendChild(li);
    });

    window.myBooksCache = books;

  } catch (err) {
    console.error(err);
    showAlert("⚠️ Could not load your books. Please login.", "warning");
  }
}


function openModal(index) {
  const books = window.myBooksCache || [];
  const book = books[index];
  selectedIndex = index;

  if (!book) return;

  document.getElementById("modalStatus").value = book.status || "To Read";
  document.getElementById("modalTitle").innerText = book.title;
  document.getElementById("modalAuthor").innerText = book.author || "Unknown";
  document.getElementById("modalImage").src = book.thumbnail || "";
  document.getElementById("modalNotes").value = book.notes || "";
  document.getElementById("modalPublisher").innerText = book.publisher || "N/A";
  document.getElementById("modalDate").innerText = book.publishedDate || "-";
  document.getElementById("modalRating").innerText = book.rating ? `${book.rating}⭐ (${book.ratingsCount || 0})` : "Not rated";
  document.getElementById("modalDescription").innerText = book.description || "No description available.";
  document.getElementById("modalPreview").href = book.previewLink || "#";

  modal.show();
}

function showAlert(msg, className) {
  const div = document.createElement("div");
  div.className = `alert alert-${className} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3 w-75 text-center`;
  div.role = "alert";
  div.innerHTML = `
    ${msg}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  document.body.appendChild(div);

  setTimeout(() => {
    div.remove();
  }, 3000);
}

// Delete book from backend
document.getElementById("modalDelete").addEventListener("click", async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not logged in');

    const books = window.myBooksCache || [];
    const book = books[selectedIndex];
    if (!book) throw new Error('Book not found');

    const res = await fetch(`${BASE_URL}/api/books/delete/${book._id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Failed to delete book');

    modal.hide();
    showAlert("❌ Book removed from your list.", "danger");
    loadMyBooks();

  } catch (err) {
    console.error(err);
    showAlert("⚠️ Could not delete the book.", "warning");
  }
});

// Save notes and status to backend
document.getElementById("modalSave").addEventListener("click", async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not logged in');

    const books = window.myBooksCache || [];
    const book = books[selectedIndex];
    if (!book) throw new Error('Book not found');

    const updatedBook = {
      notes: document.getElementById("modalNotes").value,
      status: document.getElementById("modalStatus").value
    };

    const res = await fetch(`${BASE_URL}/api/books/update/${book._id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updatedBook)
    });

    if (!res.ok) throw new Error('Failed to update book');

    modal.hide();
    showAlert("✍️ Changes updated successfully!", "info");
    loadMyBooks();

  } catch (err) {
    console.error(err);
    showAlert("⚠️ Could not update the book.", "warning");
  }
});

// Add book to backend list
async function addToList(book) {
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not logged in');

    // Send POST request to add book
    const res = await fetch(`${BASE_URL}/api/books/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(book)
    });

    const data = await res.json();

    if (res.ok) {
      showAlert("✅ Book added to your list!", "success");
      loadMyBooks();
    } else {
      showAlert(data.message || "⚠️ Could not add book.", "warning");
    }

  } catch (err) {
    console.error(err);
    showAlert("⚠️ Please login to add books.", "warning");
  }
}

searchBox.addEventListener("input", function (e) {
  const query = e.target.value.trim();
  if (query.length < 3) {
    resultsDiv.innerHTML = "";
    return;
  }
  fetch(`https://www.googleapis.com/books/v1/volumes?q=${query}`)
    .then(res => res.json())
    .then(data => {
      resultsDiv.innerHTML = "";
      (data.items || []).forEach(item => {
        const info = item.volumeInfo;
        const div = document.createElement("div");
        div.className = "book-card animate__animated animate__fadeInDown";
        div.innerHTML = `
              <img src="${(info.imageLinks?.thumbnail || '')}" class="img-fluid mb-2" alt="cover">
              <h6>${info.title}</h6>
              <p style="font-size: 0.9em">${(info.authors || []).join(", ")}</p>
              <button class="btn btn-sm btn-outline-light" onclick='addToList({ 
                title: "${info.title.replace(/"/g, '')}", 
                author: "${(info.authors?.[0] || '').replace(/"/g, '')}", 
                thumbnail: "${info.imageLinks?.thumbnail || ''}",
                publisher: "${info.publisher || ''}",
                publishedDate: "${info.publishedDate || ''}",
                rating: ${info.averageRating || null},
                ratingsCount: ${info.ratingsCount || 0},
                description: "${(info.description || '').replace(/"/g, '').replace(/\n/g, ' ').slice(0, 300)}",
                previewLink: "${info.previewLink || ''}",
                status: "To Read", 
                notes: ""         
              })'>Add to My List</button>
            `;
        resultsDiv.appendChild(div);
      });
    });
});

showListBtn.addEventListener("click", () => {
   resultsDiv.innerHTML = "";
  searchBox.value = "";
  if (myBooks.style.display === "none" || myBooks.style.display === "") {
    myBooks.style.display = "block";
    showListBtn.innerText = "Hide My List";
    loadMyBooks();
  } else {
    myBooks.style.display = "none";
    showListBtn.innerText = "Show My List";
  }

});


//export pdf 

document.getElementById("exportPdfBtn").addEventListener("click", () => {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text("My Book List", 14, 22);

  // Prepare book list text
  const books = window.myBooksCache || [];
  if (books.length === 0) {
    alert("Your book list is empty.");
    return;
  }

  doc.setFontSize(12);
  let y = 30;

  books.forEach((book, i) => {
    let line = `${i + 1}. ${book.title} — Status: ${book.status || "To Read"}`;
    doc.text(line, 14, y);
    y += 10;

    // Page break if needed
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });

  // Save the PDF
  doc.save("My_Book_List.pdf");
});


function toggleForms(show) {
  if (show === 'login') {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
  } else {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
  }
  clearAuthForms();
}

function clearAuthForms() {
  ['loginEmail', 'loginPassword', 'signupName', 'signupEmail', 'signupPassword'].forEach(
    (id) => {
      document.getElementById(id).value = '';
    }
  );
}

async function loginUser() {
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !password) {
    alert('Please fill all fields');
    return;
  }

  if (!emailRegex.test(email)) {
    alert('Invalid email format');
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('userName', data.user.name);  // ✅ Save user's name

      alert('Login successful!');
      clearAuthForms();
      showCorrectView();
    } else {
      alert(data.message || 'Login failed. Try again or signup.');
    }
  } catch (err) {
    alert('Server error. Try again later.');
  }
}


async function signupUser() {
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name || !email || !password) {
    alert('Please fill all fields');
    return;
  }

  if (!emailRegex.test(email)) {
    alert('Invalid email format');
    return;
  }

  if (password.length < 6) {
    alert('Password must be at least 6 characters');
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    alert(data.message);
    if (data.message.toLowerCase().includes('success')) {
      alert('Now login to continue!');
      toggleForms('login');
    }
  } catch (err) {
    alert('Server error. Try again later.');
  }
}


function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');  // ✅ Clear name too
  showCorrectView();
}


function showCorrectView() {
  const token = localStorage.getItem('token');
  const name = localStorage.getItem('userName');
  if (token) {
    document.getElementById("staticBooks").style.display = "none";
    document.getElementById('authContainer').style.display = 'none';
    document.getElementById('bookAppContent').style.display = 'block';
    document.getElementById('logoutBtn').style.display = 'block';

    const heading = document.getElementById('welcome-heading');
    if (heading && name) {
      heading.innerText = `Welcome, ${name}!`;
    }
  } else {
    document.getElementById('authContainer').style.display = 'block';
    document.getElementById('bookAppContent').style.display = 'none';
    document.getElementById('logoutBtn').style.display = 'none';
    toggleForms('login'); // Always start with login form
  }
}

window.onload = showCorrectView;
