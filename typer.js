class StratagemPool {
    // number[], DB indicies of stratagems in the pool
    pool = []
    // DB index of the current stratagem
    currentStratagemIndex = 0

    build() {
        this.pool = settings.activeStratagems.reduce((arr, active, i) => {
            if (active) {
                // Add items n times to have some variety and not go through each stratagem only once until the pool is built again.
                arr.push(i, i);
            }
            return arr;
        }, []);
        console.log("Built pool with", this.pool.length, "items");

        return this.pool.length;
    }

    currentIndex() {
        return this.currentStratagemIndex
    }

    current() {
        return DB.stratagems[this.currentStratagemIndex];
    }

    advance() {
        let size = this.pool.length;

        if (size == 0) {
            size = this.build();
        }

        let index = Math.floor(Math.random() * size);
        let stratagemIndex = this.pool.splice(index, 1)[0];
        this.currentStratagemIndex = stratagemIndex;

        return DB.stratagems[stratagemIndex];
    }
}

const STAT_TIMEINDEX = 0;
const STAT_SUCCESSINDEX = 1;
const STAT_FAILINDEX = 2;

class Typer {
    active = true;

    pool;

    activeCode = "";
    activeCodeCharIndex = 0;
    hasStarted = false;
    resetProgress = false;
    
    stats;
    hasStarted = false;
    hasError = false;
    advanceTime;
    startTime;
    waitTime;

    constructor(pool) {
        this.pool = pool;

        let stats = undefined;
        if ("localStorage" in window) {
            const tmp = window.localStorage.getItem("stats");
            if (tmp != undefined) {
                stats = JSON.parse(tmp);
            }
        }
        if (stats == undefined) {
            stats = new Array(DB.stratagems.length).fill(null).map(_ => [
                [], // time
                0,  // succeeds
                0,  // fails
            ]);
        }
        this.stats = stats;

        setInterval(() => {
            if ("localStorage" in window) {
                console.log("Saving stats");
                window.localStorage.setItem("stats", JSON.stringify(this.stats))
            }
        }, 5000)

        document.addEventListener("keydown",
            this.handleKeyDown.bind(this));
        
        document.addEventListener("touchstart",
            this.handleTouchStart.bind(this), { passive: true });
        document.addEventListener("touchend",
            this.handleTouchEnd.bind(this), { passive: true });
        document.addEventListener("touchmove",
            this.handleTouchMove.bind(this), { passive: false });
    }

    advance() {
        let stratagem = this.pool.advance();

        this.activeCode = stratagem.code;
        this.activeCodeCharIndex = 0;

        this.onAdvance(stratagem);

        this.advanceTime = Date.now()
        this.hasStarted = false;
        this.hasError = false;

        return stratagem;
    }

    onAdvance = (stratagem) => {}
    onSuccess = (index) => {}
    onFail = (index) => {}
    onReset = () => {}

    reset() {
        this.onReset();
        this.activeCodeCharIndex = 0;
    }

    lastX = 0;
    lastY = 0;
    touchMinY = 10000;
    touchBounds = [10000, 10000, 0, 0];
    wantTouchReset = false;
    touchInitialized = false;
    touchCanvas;
    touchCtx;
    drawStarted = false;
    touchStarted = false;

    touchImg;

    handleTouchEnd(ev) {
        if (!this.active) {
            return;
        }

        // console.log(ev);
        if (this.touchStarted) {
            ev.preventDefault();
            this.wantTouchReset = false;
        }

        return !this.touchStarted;
    }

    canvasToImage() {
        const padding = 5;
        const bounds = this.touchBounds;
        const sx = bounds[0] - padding;
        const sy = bounds[1] - padding;
        const sWidth = bounds[2] - bounds[0] + (padding * 2);
        const sHeight = bounds[3] - bounds[1] + (padding * 2);

        const tmpCan = document.createElement("canvas");
        tmpCan.width = sWidth;
        tmpCan.height = sHeight;
        const ctx = tmpCan.getContext("2d");


        ctx.drawImage(
            this.touchCanvas,
            sx, sy, sWidth, sHeight,
            0, 0, sWidth, sHeight
            );
        const dataUrl = tmpCan.toDataURL();
        this.touchImg.src = dataUrl;

        if ("sessionStorage" in window) {
            const i = pool.currentIndex();
            window.sessionStorage.setItem(`img[${i}]`, dataUrl);
        }
    }

    handleTouchStart(ev) {
        if (!this.active) {
            return;
        }
        
    // console.log(ev);
        if (!this.touchInitialized) {
            const last = document.body.lastElementChild.getBoundingClientRect();
            this.touchMinY = last.bottom;

            this.touchImg = document.createElement("img");
            document.body.appendChild(this.touchImg);

            this.touchCanvas = document.createElement("canvas");
            this.touchCanvas.width = window.innerWidth;
            this.touchCanvas.height = window.innerHeight;
            this.touchCanvas.style.position = "absolute";
            this.touchCanvas.style.display = "none";
            this.touchCanvas.style.top = "0px";
            this.touchCanvas.style.left = "0px";
            document.body.appendChild(this.touchCanvas);

            this.touchContext = this.touchCanvas.getContext("2d");
            this.touchContext.strokeStyle = "rgba(200, 0, 0, 1)";

            this.touchInitialized = true;
        }

        const touch = ev.touches[0];
        // console.log(touch.pageY, this.touchMinY);
        if (touch.pageY >= this.touchMinY) {
            this.touchBounds = [10000, 10000, 0, 0];

            this.lastX = touch.pageX;
            this.lastY = touch.pageY;

            this.touchStarted = true;
            this.touchContext.clearRect(0, 0, this.touchCanvas.width, this.touchCanvas.height);

            this.touchContext.beginPath();
            this.touchContext.moveTo(touch.pageX, touch.pageY);
        }
    }

    handleTouchMove(ev) {
        if (!this.active) {
            return;
        }
        
        if (!this.touchStarted) {
            return false;
        }
        // console.log(ev);

        if (this.wantTouchReset) {
            return false;
        }

        ev.preventDefault();

        const touch = ev.touches[0];

        if (touch.pageX < this.touchBounds[0])
            this.touchBounds[0] = touch.pageX;
        if (touch.pageX > this.touchBounds[2])
            this.touchBounds[2] = touch.pageX;
        if (touch.pageY < this.touchBounds[1])
            this.touchBounds[1] = touch.pageY;
        if (touch.pageY > this.touchBounds[3])
            this.touchBounds[3] = touch.pageY;

        this.touchContext.lineTo(touch.pageX, touch.pageY);

        const diffX = touch.pageX - this.lastX;
        const diffY = touch.pageY - this.lastY;

        let code = undefined;
        if (diffX > -25 && diffX < 25) {
            if (diffY > 25) {
                code = "S";
            } else if (diffY < -25) {
                code = "W";
            }
        } else if (diffY > -25 && diffY < 25) {
            if (diffX > 25) {
                code = "D";
            } else if (diffX < -25) {
                code = "A";
            }
        }

        // console.log(code);
        if (code == undefined) {
            return false;
        }

        if (code == this.activeCode[this.activeCodeCharIndex]) {
            this.touchContext.strokeStyle = "green";
            this.onSuccess(this.activeCodeCharIndex);

            this.activeCodeCharIndex++;

            if (this.activeCodeCharIndex == this.activeCode.length) {
                this.advance();
                this.touchContext.stroke();
                this.canvasToImage();
                this.wantTouchReset = true;

            }
        } else {
            this.touchContext.strokeStyle = "red";
            this.onFail(this.activeCodeCharIndex);
            this.hasError = true;
        }
        this.touchContext.stroke();
        this.touchContext.closePath();
        
        this.touchContext.beginPath();
        this.touchContext.moveTo(touch.pageX, touch.pageY);

        this.lastX = touch.pageX;
        this.lastY = touch.pageY;

        return false;
    }

    handleKeyDown(ev) {
        if (!this.active) {
            return;
        }
        
        let code = ev.key.toUpperCase();
        if (!"WASD".includes(code)) {
            return false;
        }

        if (this.resetProgress) {
            this.resetProgress = false;
            this.reset();
        }

        if (!this.hasStarted) {
            const now = Date.now();
            this.waitTime = now - this.advanceTime;
            this.startTime = now;

            this.hasStarted = true;
        }

        if (code == this.activeCode[this.activeCodeCharIndex]) {
            this.onSuccess(this.activeCodeCharIndex);

            this.activeCodeCharIndex++;

            if (this.activeCodeCharIndex == this.activeCode.length) {
                const time = Date.now() - this.startTime;
                console.log("Thinking time", this.waitTime, "ms");
                console.log("Time for", this.pool.current().name, time, "ms");

                const i = this.pool.currentIndex();
                const stats = this.stats[i];
                stats[STAT_TIMEINDEX].push(time);
                if (this.hasError) {
                    stats[STAT_FAILINDEX]++;
                } else {
                    stats[STAT_SUCCESSINDEX]++;
                }

                console.log(this.stats.filter(v => v[0].length > 0 || v[1] > 0 || v[2] > 0));

                this.advance();
            }
        } else {
            this.onFail(this.activeCodeCharIndex);
            this.hasError = true;

            if (settings.restartOnFail) {
                this.resetProgress = true;
            }
        }
    }
}

const pool = new StratagemPool();
const typer = new Typer(pool);

let title, icon, codeDiv;

function createTyperUi() {
    const content = document.createElement("div");
    content.className = "content";
    title = document.createElement("h1");
    icon = document.createElement("div");
    icon.classList.add("stratagem");
    codeDiv = document.createElement("div");
    codeDiv.className = "code";

    content.appendChild(title);
    content.appendChild(icon);
    content.appendChild(codeDiv);

    document.body.appendChild(content);

    return content;
}

const iconNameMap = {
    "W": "up",
    "A": "left",
    "S": "down",
    "D": "right"
}

function getCodeIconElem(c) {
    var elem = document.createElement("span");
    elem.classList.add(iconNameMap[c]);

    if (settings.codeVisibility == "partial") {
        elem.classList.add("partial");
    }
    return elem;
}

function getCodeCharElem(c) {
    let elem = document.createElement("span");
    elem.innerHTML = c;

    if (settings.codeVisibility == "partial") {
        elem.classList.add("partial");
    }
    return elem;
}

function rebuildTyper(stratagem) {
    title.innerHTML = stratagem.name;

    icon.className = "stratagem " + stratagem.icon;
    icon.style.display = settings.iconVisible ? "" : "none";

    const code = stratagem.code;

    let codeGenFn = getCodeIconElem;
    if (settings.codeStyle != "arrow") {
        codeGenFn = getCodeCharElem;
    }

    codeDiv.style.display = settings.codeVisibility == "hidden" ? "none" : "";

    codeDiv.innerHTML = ""; // clear
    for (let c of code) {
        codeDiv.appendChild(codeGenFn(c));
    }
}

typer.onAdvance = rebuildTyper;

typer.onReset = () => {
    const childNodes = codeDiv.childNodes;
    for (let child of childNodes) {
        if (child.classList.contains("success")) {
            child.classList.remove("success");
        }
        if (child.classList.contains("fail")) {
            child.classList.remove("fail");
        }
    }
}

typer.onSuccess = (index) => {
    const childNodes = codeDiv.childNodes;
    if (childNodes[index].classList.contains("fail")) {
        childNodes[index].classList.remove("fail");
    }
    childNodes[index].classList.add("success")
}

typer.onFail = (index) => {
    const childNodes = codeDiv.childNodes;
    childNodes[index].classList.add("fail")
}
