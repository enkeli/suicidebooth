const archiveOrHide = () => {
    const menuButton = document.querySelector('[aria-label="More options for post"]');
    if (!menuButton) {
        console.debug('no menu, exiting...');
        return;
    }
    menuButton?.scrollIntoView();
    menuButton?.click();

    // Waiting for menu to open
    setTimeout(() => {
        const archiveButton = document.querySelector('[aria-label="Move to archive"]');
        const hideButton = document.querySelector('[aria-label="I don\'t want to see this"]');
        
        if (archiveButton) {
            console.debug('Archiving...');
            archiveButton.click();

            setTimeout(() => {
                archiveOrHide();
            }, 5000);
        } else if (hideButton) {
            console.debug('Hiding...');
            hideButton.click();

            setTimeout(() => {
                console.debug('hide from profile...');
                let hideBtnId = 32762;
                let hideActionBtn = document.querySelector(`[data-action-id="${hideBtnId}"]`);
                
                if (!hideActionBtn) {
                    hideBtnId = 32763;
                    hideActionBtn = document.querySelector(`[data-action-id="${hideBtnId}"]`);
                }
                
                hideActionBtn.click();

                setTimeout(() => {
                    console.debug('hide confirmation...');
                    document.querySelector(`[data-action-id="${hideBtnId - 1}"]`).click();

                    setTimeout(() => {
                        console.debug('return...');
                        document.querySelector('[data-action-id="99"]').click();

                        console.debug('removing processed button...');
                        menuButton.remove();
                        setTimeout(() => {
                            archiveOrHide();
                        }, 3000);
                    }, 3000);
                }, 3000);
            }, 3000);
        } else {
            console.debug('no action buttons...');
            return;
        }
    }, 3000);
}

archiveOrHide();
