/**
 * The draw.li js
 */

function listen(element, eventName, callback) {
  element.addEventListener(eventName, callback);
}

function listenTouch(elementId, callback) {
  var el = $(elementId);
  listen(el, 'click', callback);
  listen(el, 'touchstart', callback);
}


function addClass(el, className) {
  if (!el.className.length) {
    el.className = className;
  }
  else {
    el.className += ' ' + className;
  }
}

function removeClass(el, className) {
  var classArray = el.className.split(' ');
  var classString = '';
  for (var i = 0; i < classArray.length; ++i) {
    if (classArray[i] != className) {
      classString += ' ' + classArray[i];
    }
  }
  el.className = classString;
}

function $(query) {
  return document.getElementById(query);
}

function init() {
  listenTouch('new', startEditor);
  listenTouch('back', backFromEditor);

}

function backFromEditor() {
  removeClass($('main'), 'hide');
  removeClass($('header'), 'hide');
  addClass($('editor'), 'hide');
}

function startEditor(e) {
  addClass($('main'), 'hide');
  addClass($('header'), 'hide');
  removeClass($('editor'), 'hide');


  e.preventDefault = true;
  e.stopPropagation();

  editor.start();
}



function Editor() {
  this.isLoaded = false;
  this.shouldStart = false;
  this.canvasPx = 0;
  this.mouseIsDown = false;
  this.tipsHere = false;
  this.hPos = 0;
  this.pointHistory = [];

  this.preload = function() {
    this.img = new Image();
    this.img.src = 'blank.jpeg';
    this.img.onload = this.loaded.bind(this);
    
    this.tips = new Image();
    this.tips.src = 'tips.png';

    var w = document.body.offsetWidth;
    var h = document.body.offsetHeight;
    var heightPosition = h / 2 - w / 2| 0;
    $('canvas-wrapper').style.top = heightPosition + 'px';
    this.hPos = heightPosition;
  };

  this.loaded = function () {
    this.isLoaded = true;
    if (this.shouldStart) {
      this.start();
    }
  };

  this.start = function() {
    if (!this.isLoaded) {
      this.shouldStart = true;
      return;
    }
    this.tipsHere = true;
    this.ctx = $('canvas').getContext('2d');
    this.ctx.drawImage(this.img, 0,0,640,640);
    this.ctx.drawImage(this.tips, 0,0,640,640);

    this.initListeners();
  };

  this.initListeners = function() {
    listen($('canvas'), 'mousedown', this.mouseDown.bind(this));
    listen($('canvas'), 'mouseup', this.mouseUp.bind(this));
    listen($('canvas'), 'mouseout', this.mouseUp.bind(this));
    listen($('canvas'), 'mousemove', this.mouseMove.bind(this));

    listen($('canvas'), 'touchstart', this.mouseDown.bind(this));
    listen($('canvas'), 'touchend', this.mouseUp.bind(this));
    listen($('canvas'), 'touchmove', this.mouseMove.bind(this));
    this.canvasPx = $('canvas').offsetWidth;
  };

  this.removeTips = function() {
    this.tipsHere = false;
    this.ctx.drawImage(this.img, 0,0,640,640);
  };

  this.e2x = function(e) {
    return e.clientX * (640 / this.canvasPx) | 0;
  };
  
  this.e2y = function(e) {
    return (e.clientY - this.hPos) * (640 / this.canvasPx) | 0;
  };

  this.mouseDown = function(e) {
    e.preventDefault = true;
    e.stopPropagation();
    this.mouseIsDown = true;

    if (this.tipsHere) {
      this.removeTips();
    }
    else {
      if (e.touches) {
        e = e.touches[0];
      }
      var x = this.e2x(e);
      var y = this.e2y(e);
      this.pointHistory.push({x : x, y : y});
      this.draw();
    }
  };

  this.mouseMove = function(e) {
    if (!this.mouseIsDown) {
      return;
    }

    e.preventDefault = true;
    e.stopPropagation();
    if (e.touches) {
      e = e.touches[0];
    }
    this.ctx.fillStyle = '#000';
    var x = this.e2x(e);
    var y = this.e2y(e);
    this.pointHistory.push({x : x, y : y});
    this.draw();
  };

  this.mouseUp = function(e) {
    e.preventDefault = true;
    e.stopPropagation();
    this.mouseIsDown = false;
    if (e.touches) {
      e = e.touches[0];
    }
    
    this.draw();
    this.pointHistory = [];
  };

  this.draw = function() {
    if (this.pointHistory.length == 1) {
      var p = this.pointHistory[0];
      this.pointHistory[0].x2 = p.x;
      this.pointHistory[0].x3 = p.x;
      this.pointHistory[0].y2 = p.y;
      this.pointHistory[0].y3 = p.y;
    }
    if (this.pointHistory.length > 2) {


      var p2 = this.pointHistory[this.pointHistory.length - 3];
      var p1 = this.pointHistory[this.pointHistory.length - 2];
      var p = this.pointHistory[this.pointHistory.length- 1];

      // Calculate weight segment
      var vx = p2.x - p.x;
      var vy = p2.y - p.y;

      // normalize verctor
      var vl = Math.sqrt((vx * vx) + (vy  * vy));

      // rotate vector pi2;
      var theta = Math.PI / 2;
      var cs = Math.cos(theta);
      var sn = Math.sin(theta);

      var vx2 = vx * cs - vy * sn;
      var vy2 = vx * sn + vy * cs;

      console.log(vx, vy, vx2, vy2);

      var strenght = (1 / vl) * 5;

      p1.x2 = p1.x + vx2 * strenght;
      p1.x3 = p1.x - vx2 * strenght;

      p1.y2 = p1.y + vy2 * strenght;
      p1.y3 = p1.y - vy2 * strenght;
      
      // draw
      var ctx = this.ctx;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p1.x2, p1.y2);
      ctx.lineTo(p2.x2, p2.y2);
      ctx.lineTo(p2.x, p2.y);
      ctx.lineTo(p2.x3, p2.y3);
      ctx.lineTo(p1.x3, p1.y3);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();

    }
  };
}

// init nav
init();

// init editor
var editor = new Editor();
editor.preload();
