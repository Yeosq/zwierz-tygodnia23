// Supabase initialization
const SUPABASE_URL = 'https://vouvasmrwfbealsodbmk.supabase.co;
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvdXZhc21yd2ZiZWFsc29kYm1rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MDk3MjcsImV4cCI6MjA3NTI4NTcyN30.8QX9om9jG3_DKrnnKydtmBBmoUIryM2SXhWuvGmkHKg';
const supabase = Supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const form = document.getElementById('photo-form');
const gallery = document.getElementById('gallery');
const uploadMsg = document.getElementById('upload-msg');

// Submit photo
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value;
  const petname = document.getElementById('petname').value;
  const photoFile = document.getElementById('photo').files[0];
  if(!photoFile) return;

  const fileName = `${Date.now()}-${photoFile.name}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('photos')
    .upload(fileName, photoFile);

  if(error) {
    uploadMsg.textContent = 'Błąd podczas wysyłania zdjęcia!';
    return;
  }

  // Save record in DB
  const { data: dbData, error: dbError } = await supabase
    .from('photos')
    .insert([{ username, petname, filename: fileName, votes: 0 }]);

  if(dbError) {
    uploadMsg.textContent = 'Błąd przy zapisywaniu do bazy!';
    return;
  }

  uploadMsg.textContent = 'Zdjęcie dodane pomyślnie!';
  form.reset();
  loadGallery();
});

// Load gallery
async function loadGallery() {
  const { data: photos } = await supabase
    .from('photos')
    .select('*')
    .order('votes', { ascending: false });

  gallery.innerHTML = '';
  for(const photo of photos) {
    const { publicURL } = supabase.storage.from('photos').getPublicUrl(photo.filename);
    const div = document.createElement('div');
    div.className = 'photo-card';
    div.innerHTML = `
      <img src="${publicURL}" alt="${photo.petname}">
      <h3>${photo.petname}</h3>
      <p>Dodane przez: ${photo.username}</p>
      <button class="vote-btn" onclick="vote(${photo.id}, this)">❤️ ${photo.votes}</button>
    `;
    gallery.appendChild(div);
  }
}

// Voting
async function vote(id, btn) {
  const { data, error } = await supabase.rpc('vote_photo', { photo_id: id });
  if(!error) loadGallery();
}

// Initial load
loadGallery();
