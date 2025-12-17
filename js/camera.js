/**
 * BARIN ALP PWA - Camera Module
 * Handles photo capture and image compression
 */

const Camera = {
    stream: null,
    videoElement: null,
    canvasElement: null,

    /**
     * Check if camera is available
     * @returns {boolean}
     */
    isAvailable() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    },

    /**
     * Request camera permissions
     * @returns {Promise<boolean>}
     */
    async requestPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } 
            });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.error('Camera permission denied:', error);
            return false;
        }
    },

    /**
     * Open camera for photo capture
     * @param {Object} options 
     * @returns {Promise<string|null>} Base64 image or null
     */
    async capture(options = {}) {
        const {
            facingMode = 'environment', // 'environment' for back, 'user' for front
            maxWidth = CONFIG.PHOTO.MAX_WIDTH,
            maxHeight = CONFIG.PHOTO.MAX_HEIGHT,
            quality = CONFIG.PHOTO.QUALITY
        } = options;

        return new Promise(async (resolve, reject) => {
            if (!this.isAvailable()) {
                reject(new Error('Камерата не е достъпна'));
                return;
            }

            // Create camera UI
            const overlay = this.createCameraUI();
            document.body.appendChild(overlay);

            try {
                // Get camera stream
                this.stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode,
                        width: { ideal: maxWidth },
                        height: { ideal: maxHeight }
                    }
                });

                this.videoElement = overlay.querySelector('video');
                this.videoElement.srcObject = this.stream;
                await this.videoElement.play();

                // Capture button
                const captureBtn = overlay.querySelector('.camera-capture');
                captureBtn.addEventListener('click', () => {
                    const imageData = this.takeSnapshot(maxWidth, maxHeight, quality);
                    this.closeCamera(overlay);
                    resolve(imageData);
                });

                // Cancel button
                const cancelBtn = overlay.querySelector('.camera-cancel');
                cancelBtn.addEventListener('click', () => {
                    this.closeCamera(overlay);
                    resolve(null);
                });

                // Switch camera button (if available)
                const switchBtn = overlay.querySelector('.camera-switch');
                if (switchBtn) {
                    let currentFacing = facingMode;
                    switchBtn.addEventListener('click', async () => {
                        currentFacing = currentFacing === 'environment' ? 'user' : 'environment';
                        this.stream.getTracks().forEach(track => track.stop());
                        
                        this.stream = await navigator.mediaDevices.getUserMedia({
                            video: {
                                facingMode: currentFacing,
                                width: { ideal: maxWidth },
                                height: { ideal: maxHeight }
                            }
                        });
                        this.videoElement.srcObject = this.stream;
                    });
                }

            } catch (error) {
                this.closeCamera(overlay);
                reject(error);
            }
        });
    },

    /**
     * Create camera UI overlay
     * @returns {HTMLElement}
     */
    createCameraUI() {
        const overlay = Utils.createElement('div', {
            className: 'camera-overlay'
        });

        overlay.innerHTML = `
            <style>
                .camera-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: #000;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                }
                .camera-preview {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .camera-preview video {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .camera-controls {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 24px;
                    padding: 24px;
                    background: rgba(0, 0, 0, 0.8);
                }
                .camera-btn {
                    width: 56px;
                    height: 56px;
                    border-radius: 50%;
                    border: none;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.15s;
                }
                .camera-btn:active {
                    transform: scale(0.95);
                }
                .camera-capture {
                    width: 72px;
                    height: 72px;
                    background: #fff;
                    border: 4px solid rgba(255,255,255,0.5);
                }
                .camera-capture:hover {
                    background: #f0f0f0;
                }
                .camera-cancel {
                    background: rgba(255,255,255,0.2);
                    color: #fff;
                }
                .camera-switch {
                    background: rgba(255,255,255,0.2);
                    color: #fff;
                }
            </style>
            <div class="camera-preview">
                <video autoplay playsinline></video>
            </div>
            <div class="camera-controls">
                <button type="button" class="camera-btn camera-cancel" aria-label="Отказ">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                </button>
                <button type="button" class="camera-btn camera-capture" aria-label="Снимай"></button>
                <button type="button" class="camera-btn camera-switch" aria-label="Смени камера">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                    </svg>
                </button>
            </div>
        `;

        return overlay;
    },

    /**
     * Take snapshot from video
     * @param {number} maxWidth 
     * @param {number} maxHeight 
     * @param {number} quality 
     * @returns {string} Base64 image
     */
    takeSnapshot(maxWidth, maxHeight, quality) {
        const video = this.videoElement;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate dimensions
        let width = video.videoWidth;
        let height = video.videoHeight;

        if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
        }
        if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(video, 0, 0, width, height);

        return canvas.toDataURL('image/jpeg', quality);
    },

    /**
     * Close camera and cleanup
     * @param {HTMLElement} overlay 
     */
    closeCamera(overlay) {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        overlay?.remove();
    },

    /**
     * Pick image from file input
     * @param {Object} options 
     * @returns {Promise<string|null>}
     */
    pickFromGallery(options = {}) {
        const {
            maxWidth = CONFIG.PHOTO.MAX_WIDTH,
            maxHeight = CONFIG.PHOTO.MAX_HEIGHT,
            quality = CONFIG.PHOTO.QUALITY,
            multiple = false
        } = options;

        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.multiple = multiple;

            input.addEventListener('change', async (e) => {
                const files = Array.from(e.target.files);
                
                if (files.length === 0) {
                    resolve(null);
                    return;
                }

                if (multiple) {
                    const images = await Promise.all(
                        files.map(file => this.compressImage(file, maxWidth, maxHeight, quality))
                    );
                    resolve(images);
                } else {
                    const image = await this.compressImage(files[0], maxWidth, maxHeight, quality);
                    resolve(image);
                }
            });

            input.click();
        });
    },

    /**
     * Compress image file
     * @param {File} file 
     * @param {number} maxWidth 
     * @param {number} maxHeight 
     * @param {number} quality 
     * @returns {Promise<string>} Base64 image
     */
    compressImage(file, maxWidth, maxHeight, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();

                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    let width = img.width;
                    let height = img.height;

                    // Calculate new dimensions
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    ctx.drawImage(img, 0, 0, width, height);

                    // Convert to base64
                    let result = canvas.toDataURL('image/jpeg', quality);

                    // If still too large, reduce quality
                    let currentQuality = quality;
                    while (result.length > CONFIG.PHOTO.MAX_SIZE && currentQuality > 0.1) {
                        currentQuality -= 0.1;
                        result = canvas.toDataURL('image/jpeg', currentQuality);
                    }

                    resolve(result);
                };

                img.onerror = () => reject(new Error('Грешка при зареждане на изображението'));
                img.src = e.target.result;
            };

            reader.onerror = () => reject(new Error('Грешка при четене на файла'));
            reader.readAsDataURL(file);
        });
    },

    /**
     * Open photo selection (camera or gallery)
     * @param {Object} options 
     * @returns {Promise<string|null>}
     */
    async selectPhoto(options = {}) {
        // On mobile, show options; on desktop, just open file picker
        if (this.isAvailable() && /Mobi|Android/i.test(navigator.userAgent)) {
            return new Promise((resolve) => {
                Components.modal.show({
                    title: 'Изберете източник',
                    content: `
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            <button type="button" class="btn btn-primary btn-block" data-source="camera">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                                    <circle cx="12" cy="13" r="4"/>
                                </svg>
                                Камера
                            </button>
                            <button type="button" class="btn btn-secondary btn-block" data-source="gallery">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 8px;">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                    <circle cx="8.5" cy="8.5" r="1.5"/>
                                    <polyline points="21,15 16,10 5,21"/>
                                </svg>
                                Галерия
                            </button>
                        </div>
                    `,
                    onClose: () => resolve(null)
                });

                const modal = Utils.$('.modal');
                
                modal.querySelector('[data-source="camera"]').addEventListener('click', async () => {
                    Components.modal.close();
                    try {
                        const photo = await this.capture(options);
                        resolve(photo);
                    } catch (error) {
                        Components.toast.error('Грешка при достъп до камерата');
                        resolve(null);
                    }
                });

                modal.querySelector('[data-source="gallery"]').addEventListener('click', async () => {
                    Components.modal.close();
                    const photo = await this.pickFromGallery(options);
                    resolve(photo);
                });
            });
        } else {
            return this.pickFromGallery(options);
        }
    }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Camera;
}
