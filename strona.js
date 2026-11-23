(function () {
  var spokojnie = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Nagłówek i menu */
  var naglowek = document.querySelector('.naglowek');
  function przewiniecie() { naglowek.classList.toggle('przewiniety', window.scrollY > 24); }
  window.addEventListener('scroll', przewiniecie, { passive: true });
  przewiniecie();
  var przycisk = document.getElementById('menu-przycisk');
  var nawigacja = document.getElementById('nawigacja');
  if (przycisk && nawigacja) {
    przycisk.addEventListener('click', function () {
      var otwarte = nawigacja.classList.toggle('otwarte');
      naglowek.classList.toggle('otwarte', otwarte);
      przycisk.setAttribute('aria-expanded', String(otwarte));
    });
  }

  /* Puste miejsca na zdjęcia */
  document.querySelectorAll('img[data-slot]').forEach(function (img) {
    function pusty() {
      var figura = img.closest('figure');
      var btn = img.closest('button');
      if (figura) figura.classList.add('pusty');
      if (btn) btn.remove();
    }
    img.addEventListener('error', pusty);
    if (img.complete && img.naturalWidth === 0) pusty();
  });

  /* Baner ze zmieniającymi się kadrami */
  var slajdy = document.querySelector('.slajdy');
  if (slajdy) {
    var kadry = Array.prototype.slice.call(slajdy.querySelectorAll('img'));
    var ster = document.createElement('div');
    ster.className = 'slajdy-ster';
    var obecny = 0, zegar = null, gra = !spokojnie;
    var kropki = kadry.map(function (_, i) {
      var k = document.createElement('button');
      k.type = 'button';
      k.className = 'kropka';
      k.setAttribute('aria-label', 'Pokaż kadr ' + (i + 1) + ' z ' + kadry.length);
      k.appendChild(document.createElement('i'));
      k.addEventListener('click', function () { pokaz(i); });
      ster.appendChild(k);
      return k;
    });
    var pauza = document.createElement('button');
    pauza.type = 'button';
    pauza.className = 'slajdy-pauza';
    pauza.addEventListener('click', function () {
      gra = !gra;
      odswiez();
      planuj();
    });
    ster.appendChild(pauza);
    slajdy.parentNode.appendChild(ster);

    function odswiez() {
      pauza.textContent = gra ? 'Pauza' : 'Odtwórz';
      pauza.setAttribute('aria-label', gra ? 'Zatrzymaj zmianę kadrów' : 'Wznów zmianę kadrów');
      ster.classList.toggle('pauza', !gra);
    }
    function planuj() {
      clearTimeout(zegar);
      if (gra) zegar = setTimeout(function () { pokaz((obecny + 1) % kadry.length); }, 7000);
    }
    function pokaz(i) {
      kadry[obecny].classList.remove('aktywny');
      kropki[obecny].removeAttribute('aria-current');
      obecny = i;
      kadry[i].classList.add('aktywny');
      kropki[i].setAttribute('aria-current', 'true');
      planuj();
    }
    kropki[0].setAttribute('aria-current', 'true');
    odswiez();
    planuj();
  }

  /* Rzędy zdjęć */
  document.querySelectorAll('.galeria').forEach(function (rzad) {
    var ramka = document.createElement('div');
    ramka.className = 'rzad';
    rzad.parentNode.insertBefore(ramka, rzad);
    ramka.appendChild(rzad);
    function strzalka(klasa, znak, opis, kierunek) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'rzad-btn ' + klasa;
      b.textContent = znak;
      b.setAttribute('aria-label', opis);
      b.addEventListener('click', function () { przesun(kierunek); });
      ramka.appendChild(b);
      return b;
    }
    function przesun(k) {
      rzad.scrollBy({ left: k * rzad.clientWidth * 0.8, behavior: spokojnie ? 'auto' : 'smooth' });
    }
    var lewy = strzalka('lewy', '‹', 'Poprzednie zdjęcia', -1);
    var prawy = strzalka('prawy', '›', 'Następne zdjęcia', 1);
    function stan() {
      var max = rzad.scrollWidth - rzad.clientWidth;
      lewy.hidden = rzad.scrollLeft <= 4;
      prawy.hidden = rzad.scrollLeft >= max - 4;
    }
    rzad.addEventListener('scroll', stan, { passive: true });
    window.addEventListener('resize', stan);
    rzad.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); przesun(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); przesun(-1); }
    });
    stan();
    setTimeout(stan, 600);
  });

  /* Podgląd zdjęcia */
  var podglad = document.getElementById('podglad');
  if (podglad && podglad.showModal) {
    var figura = podglad.querySelector('figure');
    var duze = podglad.querySelector('img');
    var podpis = podglad.querySelector('figcaption');
    var lista = [], pozycja = 0;
    function otworz(i) {
      pozycja = (i + lista.length) % lista.length;
      var img = lista[pozycja].querySelector('img');
      duze.src = img.dataset.full || img.currentSrc || img.src;
      duze.alt = img.alt;
      podpis.textContent = img.alt;
    }
    function nawigator(klasa, znak, opis, krok) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'podglad-nav ' + klasa;
      b.textContent = znak;
      b.setAttribute('aria-label', opis);
      b.addEventListener('click', function () { otworz(pozycja + krok); });
      figura.appendChild(b);
      return b;
    }
    var wstecz = nawigator('lewy', '‹', 'Poprzednie zdjęcie', -1);
    var dalej = nawigator('prawy', '›', 'Następne zdjęcie', 1);
    document.querySelectorAll('[data-powieksz]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var g = btn.closest('.galeria');
        lista = Array.prototype.slice.call(g.querySelectorAll('[data-powieksz]'));
        wstecz.hidden = dalej.hidden = lista.length < 2;
        otworz(lista.indexOf(btn));
        podglad.showModal();
      });
    });
    podglad.addEventListener('click', function (e) {
      if (e.target === podglad || e.target === figura || e.target.closest('.podglad-zamknij')) podglad.close();
    });
    podglad.addEventListener('keydown', function (e) {
      if (lista.length < 2) return;
      if (e.key === 'ArrowRight') otworz(pozycja + 1);
      if (e.key === 'ArrowLeft') otworz(pozycja - 1);
    });
  }

  /* Spis treści poradnika */
  var linki = document.querySelectorAll('.spis a');
  if (linki.length && 'IntersectionObserver' in window) {
    var mapa = {};
    linki.forEach(function (a) { mapa[a.getAttribute('href').slice(1)] = a; });
    var obserwator = new IntersectionObserver(function (wpisy) {
      wpisy.forEach(function (w) {
        if (!w.isIntersecting) return;
        linki.forEach(function (a) { a.classList.remove('aktywny'); });
        if (mapa[w.target.id]) mapa[w.target.id].classList.add('aktywny');
      });
    }, { rootMargin: '-18% 0px -72% 0px' });
    Object.keys(mapa).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) obserwator.observe(el);
    });
  }

  /* Formularz */
  var formularz = document.getElementById('formularz');
  if (formularz) {
    formularz.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(formularz);
      var temat = 'Zapytanie o lot dronem: ' + d.get('usluga');
      var tresc = [
        'Imię i nazwisko: ' + d.get('imie'),
        'Telefon: ' + d.get('telefon'),
        'E-mail: ' + (d.get('email') || 'nie podano'),
        'Rodzaj zlecenia: ' + d.get('usluga'),
        'Miejsce: ' + d.get('miejsce'),
        'Termin: ' + (d.get('termin') || 'do ustalenia'),
        '',
        d.get('opis') || ''
      ].join('\n');
      var pole = document.getElementById('gotowa-tresc');
      pole.value = 'Do: kontakt@pawelstec.eu\nTemat: ' + temat + '\n\n' + tresc;
      document.getElementById('gotowa-poczta').href = 'mailto:kontakt@pawelstec.eu?subject=' +
        encodeURIComponent(temat) + '&body=' + encodeURIComponent(tresc);
      document.getElementById('gotowa-status').textContent = '';
      document.getElementById('gotowa').hidden = false;
      document.getElementById('gotowa-tytul').focus();
    });
    document.getElementById('gotowa-kopiuj').addEventListener('click', function () {
      var pole = document.getElementById('gotowa-tresc');
      var status = document.getElementById('gotowa-status');
      function reczne() {
        pole.focus();
        pole.select();
        status.textContent = 'Tekst jest zaznaczony. Skopiuj go skrótem Cmd+C lub Ctrl+C.';
      }
      try {
        navigator.clipboard.writeText(pole.value).then(function () {
          status.textContent = 'Skopiowano. Wklej wiadomość w swojej poczcie.';
        }, reczne);
      } catch (err) {
        reczne();
      }
    });
  }
})();
