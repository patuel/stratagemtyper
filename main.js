class Settings {
    codeStyle = "arrow"
    codeVisibility = "visible"
    iconVisible = true
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

            let iconVisible = window.localStorage.getItem("iconVisible");
            if (iconVisible != undefined) {
                this.iconVisible = (iconVisible == "1");
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
    let configWindow = overlay();

    let content = document.querySelector("#settings")
                    .content
                    .querySelector("div")
                    .cloneNode(true);
    configWindow.elem.appendChild(content);

    // Get inputs
    const codeStyleInput = content.querySelector('select[name="codestyle"]');
    const codeVisibilityInput = content.querySelector('select[name="codevisibility"]');
    const iconVisibilityInput = content.querySelector('input[name="iconvisibility"]');
    const restartInput = content.querySelector('input[name="restart"]');

    // Load from settings
    codeStyleInput.value = settings.codeStyle;
    codeVisibilityInput.value = settings.codeVisibility;
    iconVisibilityInput.checked = settings.iconVisible;
    restartInput.checked = settings.restartOnFail;

    // Save / Cancel
    const saveBtn = content.querySelector('button[name="save"]');
    saveBtn.addEventListener("click", () => {
        settings.codeStyle = codeStyleInput.value;
        settings.codeVisibility = codeVisibilityInput.value;
        settings.iconVisible = iconVisibilityInput.checked;
        settings.restartOnFail = restartInput.checked;

        if ("localStorage" in window) {
            window.localStorage.setItem("codeStyle", codeStyleInput.value);
            window.localStorage.setItem("codeVisibility", codeVisibilityInput.value);
            window.localStorage.setItem("iconVisible", iconVisibilityInput.checked ? "1" : "0");
            window.localStorage.setItem("restartOnFail", restartInput.checked ? "1" : "0");
        }

        rebuildTyper(pool.current());

        configWindow.hide();
    });

    const cancelBtn = content.querySelector('button[name="cancel"]');
    cancelBtn.addEventListener("click", configWindow.hide);

    configWindow.show();
}

function statfield(name, value) {
    const dataContainer = document.createElement("div");
    dataContainer.className = "data";

    const dataName = document.createElement("div");
    dataName.className = "title";
    dataName.innerHTML = name;
    dataContainer.appendChild(dataName);

    const dataValue = document.createElement("div");
    dataValue.innerHTML = value;
    dataContainer.appendChild(dataValue);

    return dataContainer;
}

function openStatsUI() {
    let statsWindow = overlay();

    const content = document.createElement("div");
    content.className = "stats";
    statsWindow.elem.appendChild(content);

    const title = document.createElement("h1");
    title.innerHTML = "Statistics";
    content.appendChild(title);

    const stats = typer.stats;

    stats.forEach((stat, i) => {
        const stratagem = DB.stratagems[i];

        const data = [
            () => {
                let avgTime = Math.round(stat[STAT_TIMEINDEX].reduce((p, c) => p + c, 0) / stat[STAT_TIMEINDEX].length);
                if (!avgTime) {
                    avgTime = "N/A";
                } else {
                    avgTime += "ms";
                }
                return statfield("Avg. time", `${avgTime}`)
            },
            () => {
                return statfield("Tries", stat[STAT_SUCCESSINDEX] + stat[STAT_FAILINDEX]);
            },
            () => {
                return statfield("Perfect", stat[STAT_SUCCESSINDEX]);
            },
            () => {
                if ("localStorage" in window) {
                    const imgData = window.localStorage.getItem(`img[${i}]`);
                    if (imgData == undefined) {
                        return undefined;
                    }

                    const dataContainer = document.createElement("div");
                    dataContainer.className = "data";
                    
                    const img = document.createElement("div");
                    img.className = "img";
                    img.style.backgroundImage = `url("${imgData}")`;
                    dataContainer.appendChild(img);

                    return dataContainer;
                }
                return undefined;
            }
        ];

        const container = document.createElement("div");
        container.className = "stat";
        statsWindow.elem.appendChild(container);

        const header = document.createElement("div");
        header.className = "header";
        container.appendChild(header);

        const imageCol = document.createElement("div");
        imageCol.className = "icon";
        header.appendChild(imageCol);

        const icon = document.createElement("div");
        icon.classList.add("stratagem", stratagem.icon);
        imageCol.appendChild(icon);

        const name = document.createElement("div");
        name.className = "title";
        name.innerHTML = stratagem.name;
        header.appendChild(name);

        const statInfo = document.createElement("div");
        statInfo.className = "info";
        container.appendChild(statInfo);

        data.forEach((v) => {
            const elem = v();
            if (elem != undefined) {
                statInfo.appendChild(elem);
            }
        })
    });
    
    statsWindow.show();
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

    let statsLink = document.createElement("a");
    statsLink.href = "#";
    statsLink.innerHTML = "Stats";
    statsLink.addEventListener("click", openStatsUI);
    container.appendChild(statsLink);

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
    const elem = document.createElement("div");
    elem.className = "overlay";
    elem.style.display = "none";

    const closeFn = ((elem) => {
        return () => {
            typer.active = true;
            elem.style.display = "none";
            document.body.removeChild(elem);
        }
    })(elem);

    const closer = document.createElement("div");
    closer.className = "closer";
    elem.appendChild(closer);
    closer.addEventListener("click", closeFn);

    const x = document.createElement("span");
    x.innerHTML = "+";
    closer.appendChild(x);

    const inner = document.createElement("div");
    inner.className = "content";
    elem.appendChild(inner);

    document.body.appendChild(elem);

    return {
        elem: inner,
        show: () => {
            typer.active = false;
            elem.style.display = "";
        },
        hide: closeFn,
    }
}

onLoad();