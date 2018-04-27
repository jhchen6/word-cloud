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
    svg,
    mask,
    g,
    constant,
    svgNS = "http://www.w3.org/2000/svg",
    canvas,
    halfCanvasW,
    halfCanvasH,
    ctx,
    radian = Math.PI / 180;


var tmpCanvas,
    tmpCtx;
$(document).ready(function () {
    svg = $("svg")[0];
    mask = $("mask")[0];
    g = $("g")[0];

    canvas = document.createElement("canvas");
    $(canvas).attr("width", 960)
        .attr("height", 600);
    ctx = canvas.getContext("2d");
    ctx.translate(480, 300);
    ctx.textAlign = "center";

    halfCanvasW = canvas.width / 2;
    halfCanvasH = canvas.height / 2;

    tmpCanvas = document.createElement("canvas");
    $(tmpCanvas).attr("width", 960)
        .attr("height", 600);
    tmpCtx = tmpCanvas.getContext("2d");
    tmpCtx.translate(480, 300);
    tmpCtx.textAlign = "center";

    // $("body").prepend(tmpCanvas);
    // $("body").prepend(canvas);

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
    spiral = spirals[$("input[name='spiral']").val()];
    scale = scales[$("input[name='scale']").val()];
    font = $("#font").val();
    angleCount = +$("#angle-count").val();
    angleFrom = +$("#angle-from").val();
    if (angleFrom < -90) angleFrom = -90;
    angleTo = +$("#angle-to").val();
    if (angleTo > 90) angleTo = 90;
    words = [];
    g.innerHTML = "";
    ctx.clearRect(-halfCanvasH, -halfCanvasH, canvas.width, canvas.height);
    ctx.fillStyle = ctx.strokeStyle = "red";
    tmpCtx.fillStyle = tmpCtx.strokeStyle = "red";
}

function go() {

    prepareWords();
    var numPlaced = 0,
        len = words.length,
        word;
    for (var i = 0; i < len; i++) {
        word = words[i];
        place(word);
        if (word.placed) {
            numPlaced++;
            if (numPlaced == max) break;
        }
    }

    display();
}

function prepareWords() {
    //split text into words
    var rawWords = text.match(/\b(\w+)\b/g),
        wordCounts = {},
        len = rawWords.length,
        word;
    for (var i = 0; i < len; i++) {
        word = rawWords[i];
        word = word.toLowerCase();

        //leave out too common words like "the"
        if (commonWords.test(word)) return true;

        if (wordCounts[word] === undefined) {
            wordCounts[word] = 1;
        }
        else {
            wordCounts[word]++;
        }
    }

    for (var wordCount in wordCounts) {
        words.push({ text: wordCount, count: wordCounts[wordCount] });
    }
    words.sort(function (a, b) {
        return b.count - a.count;
    });

    // console.log(words);
    constant = (100 - 10) / (scale(words[0].count) - scale(words[words.length - 1].count));
}

function place(word) {
    var angleSlice = (angleTo - angleFrom) / (angleCount - 1),
        collision,
        thetaIncrement = Math.PI / 4,
        theta = thetaIncrement,
        origin = {},
        r2,
        r2Max;

    word.size = calSize(word);
    word.x = (Math.random() * 2 - 1) * 64; // ??
    word.y = (Math.random() * 2 - 1) * 64;
    origin.x = word.x;
    origin.y = word.y;
    r2 = 0;
    r2Max = Math.max(
        calR2({ x: -halfCanvasW, y: -halfCanvasH }, origin),
        calR2({ x: halfCanvasW, y: -halfCanvasH }, origin),
        calR2({ x: -halfCanvasW, y: halfCanvasH }, origin),
        calR2({ x: halfCanvasW, y: halfCanvasH }, origin)
    );
    word.rotate = Math.floor(Math.random() * angleCount) * angleSlice + angleFrom;

    collision = detectCollision(word);

    //
    while (!(!collision.overlap && collision.inScope) && r2 <= r2Max) {
        //calculate the position
        word.x = spiral(theta) * Math.cos(theta) + origin.x;
        word.y = spiral(theta) * Math.sin(theta) + origin.y;

        //detect collision
        collision = detectCollision(word);
        r2 = calR2(word, origin);
        theta += thetaIncrement;
    }

    if (!collision.inScope) {
        word.placed = false;
        return;
    }

    //generate fill color
    word.fill = "rgb(" + Math.random() * 256 + ", " +
        Math.random() * 256 + "," + Math.random() * 256 + ")";

    ctx.save();
    ctx.font = word.size + "px " + font;
    ctx.translate(word.x, word.y);
    ctx.rotate(word.rotate * radian);
    ctx.fillText(word.text, 0, 0);
    ctx.restore();

    // ctx.save();
    // ctx.translate(word.x, word.y);
    // ctx.strokeStyle = "black";
    // ctx.strokeRect(word.bounding.x, word.bounding.y, word.bounding.w, word.bounding.h);
    // ctx.restore();

    word.placed = true;
}

function calR2(p1, p2) {
    var dx = p1.x - p2.x;
    var dy = p1.y - p2.y;
    return dx * dx + dy * dy;
}

function detectCollision(word) {
    if (word.bounding == undefined) {
        calBoundingRect(word);
    }
    var dx = word.bounding.x,
        dy = word.bounding.y,
        w = word.bounding.w,
        h = word.bounding.h,
        x = dx + word.x + halfCanvasW,
        y = dy + word.y + halfCanvasH;

    if (word.x + dx < -halfCanvasW || word.x + dx + w > halfCanvasW ||
        word.y + dy < -halfCanvasH || word.y + dy + h > halfCanvasH) {
        word.inScope = false;
        word.overlap = undefined;
        return { inScope: false, overlap: undefined };
    }

    ctx.save();
    ctx.translate(word.x, word.y);
    var pixels = ctx.getImageData(x, y, w, h).data; //this use absolute coords = =...
    ctx.restore();


    tmpCtx.save();
    tmpCtx.clearRect(-halfCanvasW, -halfCanvasH, canvas.width, canvas.height);
    tmpCtx.font = word.size + "px " + font;
    tmpCtx.translate(word.x, word.y);
    tmpCtx.rotate(word.rotate * radian);
    tmpCtx.fillText(word.text, 0, 0);
    var tmpPixels = tmpCtx.getImageData(x, y, w, h).data;
    tmpCtx.restore();

    // var countTmp = 0,
    //     count = 0;
    var len = pixels.length;
    for (var i = 0; i < len; i += 4) {
        if (tmpPixels[i] && pixels[i]) {
            word.inScope = true;
            word.overlap = true;
            return { inScope: true, overlap: true };
        }
        //     if (tmpPixels[i]) {
        //         countTmp++;
        //     }
        //     if (pixels[i]) {
        //         count++;
        //     }
    }

    // console.log(pixels.length, count);
    // console.log(tmpPixels.length, countTmp);
    word.inScope = true;
    word.overlap = false;

    return { inScope: true, overlap: false };
}

function calBoundingRect(word) {
    ctx.save();
    ctx.font = word.size + "px " + font;
    var textW = ctx.measureText(word.text).width,
        textH = word.size,
        sin = Math.abs(Math.sin(word.rotate * radian)),
        cos = Math.abs(Math.cos(word.rotate * radian)),
        boundingW = textW * cos + textH * sin,
        boundingH = textW * sin + textH * cos,
        boundingY = - boundingH + textW / 2 * sin,
        boundingX = (word.rotate > 0)
            ? - textW / 2 * cos
            : - boundingW + textW / 2 * cos;
    word.bounding = {
        w: boundingW,
        h: boundingH,
        y: boundingY,
        x: boundingX
    }
    ctx.restore();
}

function display() {
    var text,
        numPlaced = 0,
        len = words.length,
        word;
    for (var i = 0; i < len; i++) {
        word = words[i];
        if (word.placed == false) continue;
        text = document.createElementNS(svgNS, "text");
        $(text)
            .attr("transform", 'translate(' + [word.x, word.y] +
                ') rotate(' + word.rotate + ')')
            .attr("text-anchor", "middle")
            .css({
                "font-size": word.size + "px",
                "font-family": font,
                "fill": word.fill
            })
            .text(word.text);
        g.appendChild(text);

        // var rect = document.createElementNS(svgNS, "rect");
        // $(rect)
        //     .attr({
        //         "transform": 'translate(' + [word.x, word.y] + ')',
        //         "x": word.bounding.x,
        //         "y": word.bounding.y,
        //         "width": word.bounding.w,
        //         "height": word.bounding.h
        //     })
        //     .css({
        //         "fill": "none",
        //         "stroke": "black",
        //         "stroke-width": "1"
        //     });
        // g.appendChild(rect);

        numPlaced++;
        if (numPlaced == max) break;
    }

    // var circle = document.createElementNS(svgNS, "circle");
    // $(circle)
    //     .attr({
    //         "cx": 0,
    //         "cy": 0,
    //         "r": 5
    //     })
    //     .css({
    //         "fill": "black"
    //     });
    // g.appendChild(circle);

    console.log(numPlaced);
}

var spirals = {
    archimedean: function (theta) {
        return theta * 1;
    },
    rectangular: function (theta) {
        return theta * 1;
    }
};

var scales = {
    "linear": function (n) {
        return n;
    },
    "sqrt": function (n) {
        return Math.sqrt(n);
    },
    "log": function (n) {
        return Math.log(n);
    }
};

function calSize(word) {
    return Math.round(constant * (scale(word.count) - scale(words[0].count))) + 100;
}
