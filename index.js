'use strict';
const context = document.querySelector('#canvas').getContext("2d");

const DATA = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 0, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2],
    [0, 1, 1, 1, 0, 1, 0, 0, 1, 3, 3, 3, 3, 3, 3, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
];

const RESOURCES = {};
const BLOCK_SIZE = 80;
const BLOCK_MARGIN = 0;

class Car {
    /**
     * Создает машину
     * @param {Object} resources - текстуры (передавай RESOURCES).
     * @param {number[][]} data - поле, где 0 - трава. 1 - дорога. 2 - финиш. 3 - разделитель.
     * @param {Object} context - контекст канваса (передавай context).
     * @param {number} startPosX - Координата x.
     * @param {number} startPosY - Координата y.
     */
    constructor(resources, data, context, startPosX, startPosY) {
        Car.number++;
        this._number = Car.number;
        this._sprites = [];
        for (var i = 0; i < 3; i++) {
            this._sprites[i] = {
                idle: resources.cars[i].idle,
                leftLights: resources.cars[i].left,
                rightLights: resources.cars[i].right,
                stopLights: resources.cars[i].stop
            }
        }
        this._tiles = resources.tiles;
        this._data = data;
        this._lastCoords = {
            x: startPosX,
            y: startPosY
        }
        this._context = context;
        this.draw(startPosX, startPosY, 'idle');
    }
    /**
     * Перерисовывает машину в новых коориднатах, предыдущие координаты закрашивает соответсвующей текстурой
     * @param {number} x - Координата x.
     * @param {number} y - Координата y.
     * @param {string='idle'} state - Тип автомобиля 'leftLights'||'rightLights'||'stopLights'
     */
    draw(x, y, state='idle') {
        this._tiles[this._data[this._lastCoords.y][this._lastCoords.x]].draw(context, this._lastCoords.x, this._lastCoords.y);
        this._lastCoords.x = x;
        this._lastCoords.y = y;
        this._sprites[this._number-1][state].draw(this._context, x, y)
    }
}
Car.number = 0;

class Sprite {
    constructor(image, meta) {
        this._image = image;
        this._meta = meta;
    }

    draw(context, x, y) {
        const d = {}, s = {};
        s.x = this._meta.frame.x;
        s.y = this._meta.frame.y;
        s.width = this._meta.frame.w;
        s.height = this._meta.frame.h;
        d.x = (x * BLOCK_SIZE) + (x + 1) * BLOCK_MARGIN;
        d.y = (y * BLOCK_SIZE) + (y + 1) * BLOCK_MARGIN;
        d.width = BLOCK_SIZE;
        d.height = BLOCK_SIZE;
        context.drawImage(this._image, s.x, s.y, s.width, s.height, d.x, d.y, d.width, d.height);
        return d;
    }
}

Promise.all([
    loadSpriteSheet('car'),
    loadSpriteSheet('tiles')
]).then(([resourceCar, resourceTiles]) => {
    RESOURCES.cars = [];
    for (var i = 0; i < 3; i++) {
        RESOURCES.cars[i] = {
            idle: new Sprite(
                resourceCar.image,
                resourceCar.meta.frames[4*i]
            ),
            left: new Sprite(
                resourceCar.image,
                resourceCar.meta.frames[1+4*i]
            ),
            right: new Sprite(
                resourceCar.image,
                resourceCar.meta.frames[2+4*i]
            ),
            stop: new Sprite(
                resourceCar.image,
                resourceCar.meta.frames[3+4*i]
            )
        };
    }
    console.log(RESOURCES.cars);

    RESOURCES.tiles = [
        // grass
        new Sprite(
            resourceTiles.image,
            resourceTiles.meta.frames[1]
        ),
        // road
        new Sprite(
            resourceTiles.image,
            resourceTiles.meta.frames[3]
        ),
        // finish
        new Sprite(
            resourceTiles.image,
            resourceTiles.meta.frames[0]
        ),
        // line
        new Sprite(
            resourceTiles.image,
            resourceTiles.meta.frames[2]
        )
    ];

    /*
        Вот тут фигачишь основную движуху
        Это нужно делать только в этом месте - этот кусок вызовется после того, как загрузятся все текстуры
        Вначале рисуешь карту - drawMap(DATA);
        Потом создаешь нужное количество машин - var car = new Car(RESOURCES, DATA, context, 0, 0);
        И перемещаешь - car.draw(1, 1);
    */
    drawMap(DATA);
    const car = new Car(RESOURCES, DATA, context, 0, 1)
    /* ------------ testing ------------
    // контролируешь тайминг ты
    // перерисовываются они засчет наложения текстуры на предыдущии их координаты,
    // поэтому если машины близко друг к другу надо давать им разницу во времени хотя бы 10 мс,
    // иначе может случится что текстура будет наложена на следующую машину

    var g = 0;
    setInterval(()=>{
        if (g>4) {
            car.draw(g+=2, 2);
        } else if (g===4){
            car.draw(g++, 2, 'rightLights');
        } else if (g===3){
            car.draw(g++, 1, 'rightLights');
        } else {
            car.draw(g++, 1);
        }
    }, 1010)
    const car2 = new Car(RESOURCES, DATA, context, 1, 1)
    var d = 1;
    setInterval(()=>{
        car2.draw(d++, 1, 'stopLights');
    }, 1000)
      ------------ testing ------------ */

})

function loadImage(url) {
    return new Promise((resolve) => {
        var img = new Image();
        img.onload = () => resolve(img);
        img.src = url;
    });
}

function loadSpriteSheet(name) {
    return Promise.all([
        loadImage('sprites/' + name + '.png'),
        fetch('sprites/' + name + '.json').then((response) => response.json())
    ]).then(([image, meta]) => {
        return {
            image: image,
            meta: meta
        };
    });
}
/**
 * Создает карту
 * @param {number[][]} data - поле, 0 - трава. 1 - дорога. 2 - финиш. 3 - разделитель.
 */
function drawMap(data) {
    for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < data[i].length; j++) {
            // if (data[i][j] > )
            RESOURCES.tiles[data[i][j]].draw(context, j, i);
        }
    }
}
