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

class Typer {
    pool;

    activeStratagem;
    activeCode = "";
    activeCodeCharIndex = 0;
    hasStarted = false;
    resetProgress = false;
    
    stats = {};
    hasStarted = false;
    hasError = false;
    advanceTime;
    startTime;
    waitTime;

    constructor(pool) {
        this.pool = pool;

        document.addEventListener("keydown",
            this.handleKeyDown.bind(this));
        
        document.addEventListener("touchstart",
            this.handleTouchStart.bind(this));
        document.addEventListener("touchend",
            this.handleTouchEnd.bind(this));
        document.addEventListener("touchmove",
            this.handleTouchMove.bind(this));
    }

    advance() {
        let stratagem = this.pool.advance();

        this.activeStratagem = stratagem;
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
    wantTouchReset = false;

    handleTouchEnd(ev) {
        this.wantTouchReset = false;
        return false;
    }

    handleTouchStart(ev) {
        const touch = ev.touches[0];
        this.lastX = touch.pageX;
        this.lastY = touch.pageY;
        return false;
    }

    handleTouchMove(ev) {
        if (this.wantTouchReset) {
            return false;
        }

        const touch = ev.touches[0];

        const diffX = touch.pageX - this.lastX;
        const diffY = touch.pageY - this.lastY;

        // console.log(diffX, diffY);

        let code = undefined;
        if (diffX == 0) {
            if (diffY > 0) {
                code = "S";
            } else if (diffY < 0) {
                code = "W";
            }
        } else if (diffY == 0) {
            if (diffX > 0) {
                code = "D";
            } else if (diffX < 0) {
                code = "A";
            }
        }
        this.lastX = touch.pageX;
        this.lastY = touch.pageY;

        // console.log(code);
        if (code == undefined) {
            return false;
        }

        if (code == this.activeCode[this.activeCodeCharIndex]) {
            this.onSuccess(this.activeCodeCharIndex);

            this.activeCodeCharIndex++;

            if (this.activeCodeCharIndex == this.activeCode.length) {
                this.advance();
                this.wantTouchReset = true;
            }
        } else {
            this.onFail(this.activeCodeCharIndex);
            this.hasError = true;
        }

        return false;
    }

    handleKeyDown(ev) {
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
            console.log("Thinking time", this.waitTime, "ms");

            this.hasStarted = true;
        }

        if (code == this.activeCode[this.activeCodeCharIndex]) {
            this.onSuccess(this.activeCodeCharIndex);

            this.activeCodeCharIndex++;

            if (this.activeCodeCharIndex == this.activeCode.length) {
                const time = Date.now() - this.startTime;
                console.log("Time for", this.activeStratagem.name, time, "ms");
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
