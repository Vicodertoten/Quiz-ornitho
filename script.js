// JavaScript
let birds = [];
let currentQuestion = null;
let currentType = null;
let score = 0;
let modeTexte = false;
let currentImageIndex = 0;
let imageRefs = {}; // Pour le mode explorer

// Chargement des données au démarrage
document.addEventListener("DOMContentLoaded", () => {
  fetch("birds.json")
    .then(res => res.json())
    .then(data => {
      birds = data;
      showExplorer();
    });
});

function fadeOut(element, callback) {
  element.style.opacity = 1;
  const fade = () => {
    if ((element.style.opacity -= 0.1) < 0) {
      element.style.display = "none";
      callback();
    } else {
      requestAnimationFrame(fade);
    }
  };
  fade();
}

function fadeIn(element) {
  element.style.opacity = 0;
  element.style.display = "block";
  const fade = () => {
    let val = parseFloat(element.style.opacity);
    if (!((val += 0.1) > 1)) {
      element.style.opacity = val;
      requestAnimationFrame(fade);
    }
  };
  fade();
}

function startQuiz(type) {
  currentType = type;
  score = 0;
  modeTexte = false;
  nextQuestion();
}

function startTextQuiz(type) {
  currentType = type;
  score = 0;
  modeTexte = true;
  nextQuestion();
}

function nextQuestion() {
  const main = document.getElementById("main-content");
  fadeOut(main, () => {
    const questionBird = birds[Math.floor(Math.random() * birds.length)];
    const options = shuffle([questionBird, ...getRandomBirds(3, questionBird)]);

    let media = "";
    if ((currentType === "image" || currentType === "mixte") && questionBird.images.length > 0) {
      media += getImageSlider(questionBird, true);
    }
    if ((currentType === "mixte" || currentType === "audio") && questionBird.audio) {
      media += `<div class="audio"><audio controls src="${questionBird.audio}"></audio></div>`;
    }

    let content = `<p><strong>Score actuel :</strong> ${score} bonne(s) réponse(s) d'affilée</p>${media}`;

    if (modeTexte) {
      content += `
        <input type="text" id="answer-input" placeholder="Nom de l'oiseau">
        <button onclick="checkTextAnswer('${questionBird.id}')">Valider</button>
      `;
    } else {
      const buttons = options.map(bird =>
        `<button onclick="checkAnswer('${bird.id}', '${questionBird.id}')">${bird.nom}</button>`
      ).join("");
      content += `<div class="options">${buttons}</div>`;
    }

    main.innerHTML = `<div class="quiz-question">${content}</div>`;
    fadeIn(main);
    currentQuestion = questionBird;
    currentImageIndex = 0;
  });
}

function checkAnswer(selectedId, correctId) {
  const buttons = document.querySelectorAll(".options button");
  buttons.forEach(btn => {
    if (btn.innerText === getBirdById(correctId).nom) {
      btn.style.backgroundColor = "#c8e6c9";
    }
    if (btn.innerText === getBirdById(selectedId).nom && selectedId !== correctId) {
      btn.style.backgroundColor = "#ffcdd2";
    }
    btn.disabled = true;
  });

  const isCorrect = selectedId === correctId;
  if (isCorrect) {
    score++;
  } else {
    score = 0;
  }

  showBirdDetails(getBirdById(correctId), isCorrect);
}

function checkTextAnswer(correctId) {
  const input = document.getElementById("answer-input");
  const userAnswer = input.value.trim().toLowerCase();
  const correctAnswer = getBirdById(correctId).nom.trim().toLowerCase();
  const isCorrect = userAnswer === correctAnswer;

  if (isCorrect) {
    score++;
  } else {
    score = 0;
  }

  showBirdDetails(getBirdById(correctId), isCorrect);
}

function getImageSlider(bird, isQuiz = false) {
  const id = isQuiz ? "bird-image" : `bird-image-${bird.id}`;
  if (!isQuiz) imageRefs[bird.id] = 0;
  return `
    <div class="image-slider-container">
      <button class="slider-arrow left" onclick="changeImage(${isQuiz}, '${bird.id}', -1)">&#8592;</button>
      <img id="${id}" src="${bird.images[0]}" alt="${bird.nom}">
      <button class="slider-arrow right" onclick="changeImage(${isQuiz}, '${bird.id}', 1)">&#8594;</button>
    </div>
  `;
}

function showBirdDetails(bird, isCorrect) {
  currentQuestion = bird;
  currentImageIndex = 0;
  const main = document.getElementById("main-content");
  fadeOut(main, () => {
    const media = [
      getImageSlider(bird, true),
      bird.audio ? `<div class="audio"><audio controls src="${bird.audio}"></audio></div>` : ""
    ].join("");

    main.innerHTML = `
      <div class="bird-card">
        <h2>${bird.nom} <em>(${bird.sci})</em></h2>
        ${media}
        <p>${bird.description}</p>
        <p><strong>Taille :</strong> ${bird.biometrie?.taille || "?"} |
           <strong>Poids :</strong> ${bird.biometrie?.poids || "?"} |
           <strong>Envergure :</strong> ${bird.biometrie?.envergure || "?"}</p>
        <p><strong>${isCorrect ? "✅ Bonne réponse !" : "❌ Mauvaise réponse"}</strong></p>
        <p><strong>Score :</strong> ${score} bonne(s) réponse(s) d'affilée</p>
        <button onclick="nextQuestion()">➡️ Question suivante</button>
      </div>
    `;
    fadeIn(main);
  });
}

function showExplorer() {
  const main = document.getElementById("main-content");
  fadeOut(main, () => {
    main.innerHTML = birds.map(bird => `
      <div class="bird-card">
        <h2>${bird.nom} <em>(${bird.sci})</em></h2>
        ${getImageSlider(bird)}
        ${bird.audio ? `<div class="audio"><audio controls src="${bird.audio}"></audio></div>` : ""}
        <p>${bird.description}</p>
        <p><strong>Taille :</strong> ${bird.biometrie?.taille || "?"} |
           <strong>Poids :</strong> ${bird.biometrie?.poids || "?"} |
           <strong>Envergure :</strong> ${bird.biometrie?.envergure || "?"}</p>
      </div>
    `).join("");
    fadeIn(main);
  });
}

function getRandomBirds(n, exclude) {
  const copy = birds.filter(b => b.id !== exclude.id);
  return shuffle(copy).slice(0, n);
}

function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

function getBirdById(id) {
  return birds.find(b => b.id === id);
}

function changeImage(isQuiz, birdId, direction) {
  if (isQuiz) {
    if (!currentQuestion || currentQuestion.images.length === 0) return;
    currentImageIndex = (currentImageIndex + direction + currentQuestion.images.length) % currentQuestion.images.length;
    const img = document.getElementById("bird-image");
    img.src = currentQuestion.images[currentImageIndex];
  } else {
    const bird = getBirdById(birdId);
    if (!bird || bird.images.length === 0) return;
    imageRefs[birdId] = (imageRefs[birdId] + direction + bird.images.length) % bird.images.length;
    const img = document.getElementById(`bird-image-${birdId}`);
    img.src = bird.images[imageRefs[birdId]];
  }
}
