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

    constructor(pool) {
        this.pool = pool;

        document.addEventListener("keydown", this.handleKeyDown.bind(this));
    }

    advance() {
        let stratagem = this.pool.advance();

        this.activeStratagem = stratagem;
        this.activeCode = stratagem.code;
        this.activeCodeCharIndex = 0;

        this.onAdvance(stratagem);

        return stratagem;
    }

    onAdvance = (stratagem) => {}
    onSuccess = (index) => {}
    onFail = (index) => {}
    onReset = () => {}

    handleKeyDown(ev) {
        let code = ev.key.toUpperCase();
        if (!"WASD".includes(code)) {
            return false;
        }

        if (this.resetProgress) {
            this.resetProgress = false;
            this.onReset();
        }

        if (code == this.activeCode[this.activeCodeCharIndex]) {
            this.onSuccess(this.activeCodeCharIndex);

            this.activeCodeCharIndex++;

            if (this.activeCodeCharIndex == this.activeCode.length) {
                const stratagem = this.advance();
            }
        } else {
            this.onFail(this.activeCodeCharIndex);

            if (settings.restartOnFail) {
                this.activeCodeCharIndex = 0;
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
    return elem;
}

function getCodeCharElem(c) {
    let elem = document.createElement("span");
    elem.innerHTML = c;
    return elem;
}

typer.onAdvance = (stratagem) => {
    title.innerHTML = stratagem.name;
    icon.className = "stratagem " + stratagem.icon;

    const code = stratagem.code;

    let codeGenFn = getCodeIconElem;
    if (settings.codeStyle != "arrow") {
        codeGenFn = getCodeCharElem;
    }

    codeDiv.innerHTML = ""; // clear
    for (let c of code) {
        codeDiv.appendChild(codeGenFn(c));
    }
}

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
