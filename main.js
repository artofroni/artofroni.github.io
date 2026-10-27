const gallery = document.getElementById("gallery");
const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lb-img");
const lbCap = document.getElementById("lb-cap");

// Eserler eserler.json dosyasından gelir; admin.html bu dosyayı günceller
let eserler = [];
let current = 0;

const ETIKET = { satilik: "Satılık", satildi: "Satıldı" };

const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Fotoğraf henüz yoksa yerine renkli bir yer tutucu göster
function placeholder(text) {
  const hue = [...text].reduce((h, c) => h + c.charCodeAt(0), 0) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="750">
    <rect width="100%" height="100%" fill="hsl(${hue},35%,78%)"/>
    <text x="50%" y="50%" text-anchor="middle" font-family="sans-serif" font-size="28" fill="hsl(${hue},30%,35%)">${esc(text)}</text>
  </svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

function caption(e) {
  const detay = [e.teknik, e.olcu, e.yil].filter(Boolean).map(esc).join(", ");
  return `<strong>${esc(e.baslik)}</strong>${detay ? " · " + detay : ""}`;
}

// Kaydırınca beliren öğeler
const revealer = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add("in"); revealer.unobserve(en.target); }
  });
}, { threshold: 0.12 });

function reveal(els) {
  els.forEach(el => { el.classList.add("reveal"); revealer.observe(el); });
}

function render() {
  if (!eserler.length) {
    gallery.innerHTML = `<p class="empty-note">Yeni eserler çok yakında burada.</p>`;
    return;
  }
  gallery.innerHTML = eserler.map((e, i) => `
    <figure class="art" data-i="${i}" style="transition-delay:${(i % 3) * 90}ms">
      <img src="${esc(e.dosya)}" alt="${esc(e.baslik)}" loading="lazy"
           onerror="this.onerror=null;this.src='${placeholder(e.baslik)}'">
      ${ETIKET[e.durum] ? `<span class="badge ${e.durum}">${ETIKET[e.durum]}</span>` : ""}
      <figcaption>${caption(e)}</figcaption>
    </figure>`).join("");
  reveal(gallery.querySelectorAll(".art"));
}

async function loadEserler() {
  try {
    const res = await fetch("eserler.json?v=" + Date.now());
    eserler = await res.json();
    render();
  } catch {
    gallery.innerHTML = `<p class="empty-note">Eserler şu an yüklenemedi, lütfen sayfayı yenileyin.</p>`;
  }
}

function openLightbox(i) {
  current = (i + eserler.length) % eserler.length;
  const e = eserler[current];
  const thumb = gallery.querySelector(`[data-i="${current}"] img`);
  lbImg.src = thumb ? thumb.src : e.dosya;
  lbImg.alt = e.baslik;
  lbCap.innerHTML = caption(e);
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  lightbox.hidden = true;
  document.body.style.overflow = "";
}

gallery.addEventListener("click", ev => {
  const fig = ev.target.closest(".art");
  if (fig) openLightbox(+fig.dataset.i);
});
lightbox.querySelector(".lb-close").onclick = closeLightbox;
lightbox.querySelector(".lb-prev").onclick = () => openLightbox(current - 1);
lightbox.querySelector(".lb-next").onclick = () => openLightbox(current + 1);
lightbox.addEventListener("click", ev => { if (ev.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", ev => {
  if (lightbox.hidden) return;
  if (ev.key === "Escape") closeLightbox();
  if (ev.key === "ArrowLeft") openLightbox(current - 1);
  if (ev.key === "ArrowRight") openLightbox(current + 1);
});

// Sağ tıkla resim indirmeyi zorlaştır (tam koruma değildir)
gallery.addEventListener("contextmenu", ev => { if (ev.target.tagName === "IMG") ev.preventDefault(); });

// Menüde bulunulan bölümü vurgula
const navLinks = document.querySelectorAll(".nav nav a");
const spy = new IntersectionObserver(entries => {
  entries.forEach(en => {
    if (!en.isIntersecting) return;
    navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
  });
}, { rootMargin: "-45% 0px -50% 0px" });
document.querySelectorAll("section[id]").forEach(s => spy.observe(s));

document.getElementById("year").textContent = new Date().getFullYear();
reveal(document.querySelectorAll(".section-head, .section > h2, .section > .lead, .about > *, .card, .contact-links"));
loadEserler();
