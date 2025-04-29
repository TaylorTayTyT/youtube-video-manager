const tabs = await chrome.tabs.query({
    url: [
        "https://www.youtube.com/watch?*",
    ]
});

async function gatherVideos() {
    const tabIds = tabs.map(({ id }) => id);
    const videosParentElement = document.getElementById("videos");
    const savedData = await chrome.storage.local.get();
    //console.log(savedData)
    Object.keys(savedData).forEach(key => {
        //console.log(key, tabIds)
        //console.log(tabIds.includes(parseInt(key)))
        if (!tabIds.includes(parseInt(key))) {
            delete savedData[key];
        }
    });
    chrome.storage.local.clear()
        .then(() => chrome.storage.local.set(savedData));
    tabIds.forEach(async (video) => {
        // information for the block
        const v = document.createElement("li");
        const vi = await chrome.tabs.get(video);
        const title = document.createElement("div");
        title.classList.add("title");
        title.setAttribute("tabId", vi.id);
        title.innerText = vi.title;
        const input = document.createElement("input");
        input.setAttribute("tabId", vi.id);
        input.style.display = 'none';
        title.ondblclick = renameVideo;

        //playButton setup
        const playButton = document.createElement("img");
        playButton.title = "play";
        playButton.src = "./assets/play.png";
        playButton.innerText = "play";
        playButton.setAttribute("tabId", vi.id);
        playButton.onclick = playVideo;
        playButton.classList.add("play");

        //pauseButton setup
        const pauseButton = document.createElement("img");
        pauseButton.title = "pause";
        pauseButton.src = "./assets/pause.png";
        pauseButton.innerText = "pause";
        pauseButton.onclick = pauseVideo;
        pauseButton.setAttribute("tabId", vi.id);
        pauseButton.classList.add("pause");

        //replay setup
        const replayButton = document.createElement("img");
        replayButton.title = "replay";
        replayButton.src = "./assets/replay.png";
        replayButton.onclick = replay;
        replayButton.setAttribute("tabId", vi.id);

        //redirect setup
        const navigateButton = document.createElement("img");
        navigateButton.title = "navigate to video";
        navigateButton.src = "./assets/navigate.png";
        navigateButton.setAttribute("tabId", vi.id);
        navigateButton.onclick = navigate;

        //memory
        if (Object.keys(savedData).includes(String(vi.id))) {
            title.innerText = savedData[vi.id];
        }

        //assembly
        v.appendChild(title)
        v.appendChild(input)
        v.appendChild(playButton);
        v.appendChild(pauseButton);
        v.appendChild(replayButton);
        v.appendChild(navigateButton);
        videosParentElement.appendChild(v)
    })
};

function renameVideo(element) {
    element.target.style.display = 'none';
    //console.log(element)
    const tabId = element.target.getAttribute("tabId");
    const input = document.querySelector(`input[tabId="${tabId}"]`);
    input.value = element.target.innerText;
    //console.log(`input[tabId=${tabId}]`)
    input.style.display = "block";
    async function save(e) {
        if (input !== document.activeElement || e.key && e.key === 'Enter') {
            input.style.display = "none";
            element.target.style.display = "block";
            element.target.innerText = input.value;
            const title_storage = {};
            document.querySelectorAll(".title").forEach(title => {
                const tabId = title.getAttribute("tabId");
                title_storage[tabId] = title.innerText;
            });

            await chrome.storage.local.set(title_storage)

            window.removeEventListener("click", save);
        }
    };
    input.addEventListener('keypress', save)
    window.addEventListener("click", save);

};

function playVideo(e) {
    const tabId = parseInt(e.target.getAttribute("tabid"));
    //console.log(e.target)
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
            document.querySelector("video").play();
        }
    }, () => {
        e.target.classList.add("selected");
        console.log(e.target.parentElement);
        e.target.parentElement.childNodes.forEach((child) => {
            console.log(child.classList);
            if (child.classList.contains("pause")) {
                console.log(child)
                child.classList.remove("selected");
            }
        })
    })
};
function pauseVideo(e) {
    const tabId = parseInt(e.target.getAttribute("tabid"));
    //console.log(tabId)
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
            document.querySelector("video").pause();
        }
    }, () => {
        e.target.classList.add("selected");
        console.log(e.target.parentElement);
        e.target.parentElement.childNodes.forEach((child) => {
            console.log(child.classList);
            if (child.classList.contains("play")) {
                console.log(child)
                child.classList.remove("selected");
            }
        })
    })
}
function replay(e) {
    const tabId = parseInt(e.target.getAttribute("tabid"));
    chrome.scripting.executeScript({
        target: { tabId: tabId },
        func: () => {
            document.querySelector("video").currentTime = 0;
        }
    }, () => {

        e.parentElement().childNodes().forEach((child) => {
            if (child.innerText === "pause") {
                child.classList.remove("selected");
            }
        })
    })
};

function navigate(e) {
    const tabId = parseInt(e.target.getAttribute("tabid"));
    chrome.tabs.update(tabId, { active: true });
}
gatherVideos(); 
