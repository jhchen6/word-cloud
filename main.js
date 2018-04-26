//the RegExp is from https://www.jasondavies.com/wordcloud/cloud.min.js
var commonWords = /^(i|me|my|myself|we|us|our|ours|ourselves|you|your|yours|yourself|yourselves|he|him|his|himself|she|her|hers|herself|it|its|itself|they|them|their|theirs|themselves|what|which|who|whom|whose|this|that|these|those|am|is|are|was|were|be|been|being|have|has|had|having|do|does|did|doing|will|would|should|can|could|ought|i'm|you're|he's|she's|it's|we're|they're|i've|you've|we've|they've|i'd|you'd|he'd|she'd|we'd|they'd|i'll|you'll|he'll|she'll|we'll|they'll|isn't|aren't|wasn't|weren't|hasn't|haven't|hadn't|doesn't|don't|didn't|won't|wouldn't|shan't|shouldn't|can't|cannot|couldn't|mustn't|let's|that's|who's|what's|here's|there's|when's|where's|why's|how's|a|an|the|and|but|if|or|because|as|until|while|of|at|by|for|with|about|against|between|into|through|during|before|after|above|below|to|from|up|upon|down|in|out|on|off|over|under|again|further|then|once|here|there|when|where|why|how|all|any|both|each|few|more|most|other|some|such|no|nor|not|only|own|same|so|than|too|very|say|says|said|shall)$/;

var text,
    max,
    spiral, //
    scale,
    font,
    angleCount,
    angleFrom,
    angleTo,
    words,
    g,
    constant;

$(document).ready(function () {
    g = $("g")[0];
    $("#form").submit(function () {
        init();
        go();
        return false;
    });
    init();
    go();
});

function init() {
    text = $("#text").val();
    max = +$("#max").val();
    spiral = $("input[name='spiral']").val();
    scale = selectScale($("input[name='scale']").val());
    font = $("#font").val();
    angleCount = +$("#angle-count").val();
    angleFrom = +$("#angle-from").val();;
    angleTo = +$("#angle-to").val();
    words = [];
    g.innerHTML = "";
}

function go() {
    var numPlaced = 0;

    prepareWords();
    words.forEach(function (word, index) {
        if (place(word)) {
            numPlaced++;
            if (numPlaced === max) return false;
        }
    });

    display();
}

function prepareWords() {
    var rawWords = text.match(/\b(\w+)\b/g);
    var wordCounts = {};

    rawWords.forEach(function (word) {
        //TODO: leave out too common words like "the"
        word = word.toLowerCase();
        if (commonWords.test(word)) return true;

        if (wordCounts[word] === undefined) {
            wordCounts[word] = 1;
        }
        else {
            wordCounts[word]++;
        }
    });

    for (var wordCount in wordCounts) {
        words.push({ text: wordCount, count: wordCounts[wordCount] });
    }
    words.sort(function (a, b) {
        return b.count - a.count;
    });

    constant = (100 - 10) / (scale(words[0].count) - scale(words[words.length - 1].count));
    console.log(words);
}

function place(word) {
    //calculate the position
    var angleSlice = (angleTo - angleFrom) / (angleCount - 1);
    word.x = Math.random() * 960 - 480;
    word.y = Math.random() * 600 - 300;

    //calculate rotation
    word.rotate = Math.round(Math.random() * angleCount) * angleSlice + angleFrom;
    word.size = calSize(word);

    //detect collision
    var collide = false;

    if (collide) return false;

    //generate fill color
    word.fill = "rgb(" + Math.random() * 255 + ", " +
        Math.random() * 255 + "," + Math.random() * 255 + ")";
    return true;
}

function display() {
    var texts = [];
    words.forEach(function (word) {
        texts.push('<text transform="translate(' + word.x + ',' + word.y +
            ') rotate(' + word.rotate + ')" style="font-size: ' + word.size +
            'px; font-family: ' + font + '; fill: ' + word.fill + ';">' + word.text + '</text>');
    });
    g.innerHTML = texts.join("");
}

function selectScale(selector) {
    switch (selector) {
        case "linear":
            return function (n) {
                return n;
            }
            break;
        case "sqrt":
            return function (n) {
                return Math.sqrt(n);
            }
            break;
        case "log":
            return function (n) {
                return Math.log(n);
            }
            break;
        default:
            break;
    }
}

function calSize(word) {
    return constant * (scale(word.count) - scale(words[0].count)) + 100;
};
