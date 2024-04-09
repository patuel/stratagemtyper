class Settings {
    codeStyle = "arrow"
    codeVisibility = "visible"
    iconVisibility = "visible"
    restartOnFail = true
    // bool[], array of boolean with the length equal to the count of all stratagems
    //         the index equals the index of the stratagem array and the value indicates if it's active
    activeStratagems = [];

    load() {
        // TODO: Load this from localstore
        this.activeStratagems = new Array(DB.stratagems.length).fill(true);

        if ('localStorage' in window) {
            let loadedStratagems = window.localStorage.getItem("activeStratagems")
            if (loadedStratagems != undefined) {
                this.activeStratagems = loadedStratagems.split('').map(v => v == "1")
            }

            let codeStyle = window.localStorage.getItem("codeStyle");
            if (codeStyle != undefined) {
                this.codeStyle = codeStyle;
            }

            let codeVisibility = window.localStorage.getItem("codeVisibility");
            if (codeVisibility != undefined) {
                this.codeVisibility = codeVisibility;
            }

            let iconVisibility = window.localStorage.getItem("iconVisibility");
            if (iconVisibility != undefined) {
                this.iconVisibility = iconVisibility;
            }

            let restartOnFail = window.localStorage.getItem("restartOnFail");
            console.log(restartOnFail);
            if (restartOnFail != undefined) {
                this.restartOnFail = (restartOnFail == "1");
            }
        }

        console.log("loaded settings", this);
    }

    save() {
        if ('localStorage' in window) {
            window.localStorage.setItem("activeStratagems", this.activeStratagems.map(v => +v).join(""));
            window.localStorage.setItem("codeStyle", this.codeStyle);
            window.localStorage.setItem("codeVisibility", this.codeVisibility);
            window.localStorage.setItem("iconVisibility", this.iconVisibility);
            window.localStorage.setItem("restartOnFail", this.restartOnFail ? "1" : "0");
        }
    }
}

let settings;

function openSelectUI(ev) {
    let configWindow = overlay();

    let stratagemsConfig = [];

    let saveContainer = document.createElement("div");
    saveContainer.className = "selector";

    let save = document.createElement("button");
    save.innerHTML = "Save";
    save.addEventListener("click", () => {
        let indicies = stratagemsConfig.map(v => v.active);
        if (indicies.length == 0) {
            alert("Select at least one stratagem.");
        } else {
            settings.activeStratagems = indicies;
            settings.save();

            pool.build();
            typer.advance();
            
            configWindow.hide();
        }
    });
    saveContainer.appendChild(save);

    let cancel = document.createElement("button");
    cancel.innerHTML = "Cancel";
    cancel.addEventListener("click", () => {
        configWindow.hide();
    });
    saveContainer.appendChild(cancel);

    configWindow.elem.appendChild(saveContainer);

    let toggleFn = (key) => {
        var stratsFiltered = stratagemsConfig;
        if (key != undefined) {
            console.log(stratsFiltered);
            stratsFiltered = stratsFiltered.filter(value => value.stratagem.key == key);
        }
        let activeCount = stratsFiltered.reduce((p, c) => {
            return p + (c.active ? 1 : 0);
        }, 0);
        let activate = activeCount <= (stratsFiltered.length * .5);
        for (let stratagem of stratsFiltered) {
            if (activate) {
                stratagem.setActive();
            } else {
                stratagem.setInactive();
            }
        }
    };

    const toggleContainer = document.createElement("div");
    toggleContainer.className = "toggleAll";

    let toggle = document.createElement("a");
    toggle.href = "#";
    toggle.innerHTML = "Toggle all";
    toggle.addEventListener("click", (ev) => {
        toggleFn();
    });
    toggleContainer.appendChild(toggle);
    configWindow.elem.appendChild(toggleContainer);

    for (let key in DB.groups) {
        let group = DB.groups[key];

        let groupTitle = document.createElement("h2");
        groupTitle.style.display = "inline-block";
        groupTitle.innerHTML = group.name;
        groupTitle.style.color = group.color;
        configWindow.elem.appendChild(groupTitle);

        let toggle = document.createElement("a");
        toggle.href = "#";
        toggle.innerHTML = "Toggle group";
        toggle.addEventListener("click", (ev) => {
            console.log(ev);
            toggleFn(key);
        });
        configWindow.elem.appendChild(toggle);

        let stratagemDiv = document.createElement("div");
        DB.stratagems.forEach((stratagem, i) => {
            if (stratagem.key != key) {
                return;
            }
            let item = {
                stratagem,
                index: i,
                active: settings.activeStratagems[i],
                elem: undefined,
                setActive() {
                    item.active = true;
                    this.elem.className = "stratagem active " + stratagem.icon;
                },
                setInactive() {
                    item.active = false;
                    this.elem.className = "stratagem " + stratagem.icon;
                }
            };

            let elem = document.createElement("div");
            elem.style.display = "inline-block";
            elem.classList.add("stratagem", stratagem.icon);
            elem.alt = stratagem.name;
            elem.title = stratagem.name;
            item.elem = elem;

            if (item.active) {
                item.setActive();
            }

            elem.addEventListener("click", (ev) => (function(ev, e) {
                if (e.active) {
                    e.setInactive();
                } else {
                    e.setActive();
                }
            }(ev, item)));
            stratagemsConfig.push(item);
            stratagemDiv.appendChild(elem);
        });
        configWindow.elem.appendChild(stratagemDiv);
    }

    configWindow.show();
}

function openConfigUI(ev) {
    alert("N/A");
}

function buildMenu() {
    let container = document.createElement("div");
    container.className = "menu";

    let stratagemLink = document.createElement("a");
    stratagemLink.href = "#";
    stratagemLink.innerHTML = "Select Stratagems";
    stratagemLink.addEventListener("click", openSelectUI);
    container.appendChild(stratagemLink);

    let configLink = document.createElement("a");
    configLink.href = "#";
    configLink.innerHTML = "Config";
    configLink.addEventListener("click", openConfigUI);
    container.appendChild(configLink);

    document.body.appendChild(container);
}

function onLoad(ev) {
    settings = new Settings();
    settings.load();

    buildMenu();
    createTyperUi();

    typer.advance();
}

// UI

function overlay() {
    let elem = document.createElement("div");
    elem.className = "overlay";
    elem.style.display = "none";

    let inner = document.createElement("div");
    elem.appendChild(inner);

    document.body.appendChild(elem);

    return {
        elem: inner,
        show: () => {
            elem.style.display = "";
        },
        hide: () => {
            elem.style.display = "none";
            document.body.removeChild(elem);
        }
    }
}

onLoad();