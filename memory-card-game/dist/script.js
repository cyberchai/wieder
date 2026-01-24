var possibleCardFaces = ["&#x1F602;", "&#x1F60E;", "&#x1F60D;", "&#x1F61C;", "&#x1F643;", "&#x1F913;", "&#x1F602;", "&#x1F60E;", "&#x1F60D;", "&#x1F61C;", "&#x1F643;", "&#x1F913;"];
var lowScore = localStorage.getItem("lowScore");
var score = 0;
var flippedCards = [];
var matchedCards = [];
var locked = false;
var flipTimeout = 700;

function assignLowScore($lowScoreOutput) {
  lowScore = lowScore || "N/A";
  $lowScoreOutput.text("Low Score: " + lowScore);
}

function getRandomIndex(length) {
  return Math.floor(Math.random() * length);
}

function getRandomFace(randomIndex) {
  var face;
  randomIndex = getRandomIndex(possibleCardFaces.length);
  face = possibleCardFaces[randomIndex];
  possibleCardFaces.splice(randomIndex, 1);
  return face;
}

function assignCardFaces($cardFaces) {
  for (var i = 0; i < 12; i++) {
    $($cardFaces[i]).html("<h2>" + getRandomFace() + "</h2>");
  }
  possibleCardFaces = ["&#x1F602;", "&#x1F60E;", "&#x1F60D;", "&#x1F61C;", "&#x1F643;", "&#x1F913;", "&#x1F602;", "&#x1F60E;", "&#x1F60D;", "&#x1F61C;", "&#x1F643;", "&#x1F913;"];
}

function isNotFlipped($card) {
  return !$card.hasClass("flipped");
}

function areMatching(flippedCards) {
  return (flippedCards[0].html() === flippedCards[1].html());
}

function hideCards(flippedCards) {
  setTimeout(function() {
    $(flippedCards[0]).removeClass("flipped");
    $(flippedCards[1]).removeClass("flipped");
    locked = false;
  }, flipTimeout);
}

function hideScoreBoard($scoreBoard) {
  $scoreBoard.addClass("hidden");
}

function checkForLowScore(score, $lowScoreOutput) {
  if (lowScore === "N/A") {
    lowScore = Infinity;
  }
  if (score < lowScore) {
    localStorage.setItem("lowScore", score);
    lowScore = localStorage.getItem("lowScore");
    $lowScoreOutput.html("<em>*new*</em> Low Score: " + score);
  }
}

function renderWinScreen($winScreen) {
  setTimeout(function() {
    $winScreen.addClass("visible");
  }, 400);
}

function reset($lowScoreOutput, $cardFaces, $gameClicks, $gameCardElements, $winScreen, $scoreBoard) {
  assignCardFaces($cardFaces);
  matchedCards = [];
  score = 0;
  $lowScoreOutput.text("Low Score: " + lowScore);
  $gameClicks.text("Total Clicks: " + score);
  $winScreen.removeClass("visible");
  $scoreBoard.removeClass("hidden");
  $gameCardElements.removeClass("flipped");
}

$(document).ready(function(){
  var $newGameButton = $("#new-game-button");
  var $gameContainer = $("#game-container");
  var $gameCardElements = $(".game-card");
  var $cardFaces = $(".game-card .back");
  var $scoreBoard = $("#score-board");
  var $gameClicks = $(".click-count");
  var $lowScoreOutput = $(".low-score");
  var $winScreen = $("#win-screen");
  var $replay = $("#replay-button");
  var $footer = $("footer");

  assignLowScore($lowScoreOutput);
  assignCardFaces($cardFaces);

  $newGameButton.on("click", function() {
    $gameContainer.removeClass("hidden");
    $footer.removeClass("hidden");
  });

  $gameContainer.on("click", ".front, .front h2", function(event) {
    if(event.target != this || locked){ return true; }

    // in case I decide to put a figure on front of card
    var $card = $(event.target).closest(".game-card");

    if (isNotFlipped($card)) {
      $card.addClass("flipped");
      flippedCards.push($card);
      score++;
      $gameClicks.text("Total Clicks: " + score);
    }

    if (flippedCards.length === 2) {
      if (areMatching(flippedCards)) {
        matchedCards.push(flippedCards[0], flippedCards[1]);
      } else {
        locked = true;
        hideCards(flippedCards);
      }
      flippedCards = [];
    }

    if(matchedCards.length === $gameCardElements.length) {
      checkForLowScore(score, $lowScoreOutput);
      hideScoreBoard($scoreBoard);
      renderWinScreen($winScreen);
    }
  });

  $replay.on("click", function() {
    reset($lowScoreOutput, $cardFaces, $gameClicks, $gameCardElements, $winScreen, $scoreBoard);
  });

  // Smooth Scrolling
  $("a").on('click', function(event) {
    if (this.hash !== "") {
      event.preventDefault();
      var hash = this.hash;
      $('html, body').animate({
        scrollTop: $(hash).offset().top
        }, 600);
    }
  });
})