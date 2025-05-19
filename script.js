document.addEventListener('DOMContentLoaded', () => {
    const apiKeyInput = document.getElementById('apiKey');
    const saveApiKeyButton = document.getElementById('saveApiKey');
    const flowerImageInput = document.getElementById('flowerImageInput');
    const identifyFlowerButton = document.getElementById('identifyFlowerButton');
    const imagePreview = document.getElementById('imagePreview');
    const removeImageButton = document.getElementById('removeImageButton');
    const identificationResult = document.getElementById('identificationResult');
    const chatInput = document.getElementById('chatInput');
    const sendMessageButton = document.getElementById('sendMessageButton');
    const chatBox = document.getElementById('chatBox');
    const settingsButton = document.getElementById('settingsButton');
    const settingsModal = document.getElementById('settingsModal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const takePictureButton = document.getElementById('takePictureButton');
    const cameraPreview = document.getElementById('cameraPreview');
    const cameraContainer = document.querySelector('.camera-container');
    const capturePictureButton = document.getElementById('capturePictureButton');
    const cancelCameraButton = document.getElementById('cancelCameraButton');
    
    // Camera stream reference
    let mediaStream = null;
    
    // Tab functionality
    const tabItems = document.querySelectorAll('.tab-item');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabItems.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs and contents
            tabItems.forEach(item => item.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Constants
    const SHAPES_API_BASE_URL = 'https://api.shapes.inc/v1';
    const FLORA_MODEL_ID = 'shapesinc/flora-lqcv';
    
    // State management
    let shapesApiKey = localStorage.getItem('shapesApiKey');
    let flowerCollection = JSON.parse(localStorage.getItem('flowerCollection')) || [];
    
    // Initialize
    if (shapesApiKey) {
        apiKeyInput.value = shapesApiKey;
    }
    
    // Display flower collection if it exists
    function displayFlowerCollection() {
        const collectionContainer = document.getElementById('flowerCollectionContainer');
        collectionContainer.innerHTML = '';
        
        if (flowerCollection.length === 0) {
            collectionContainer.innerHTML = '<p>Your collection is empty. Identify flowers to add them!</p>';
            return;
        }

        flowerCollection.forEach((flower, index) => {
            const flowerCard = document.createElement('div');
            flowerCard.className = 'flower-card';
            flowerCard.innerHTML = `
                <img src="${flower.imageDataUrl}" alt="${flower.name || 'Unknown flower'}" class="flower-thumbnail">
                <div class="flower-info">
                    <h3>${flower.name || 'Unknown flower'}</h3>
                    <div class="species-name">${flower.details.species || ''}</div>
                    <p>${flower.date}</p>
                    <button class="view-details-button" data-index="${index}">View Details</button>
                    <button class="delete-button" data-index="${index}">Delete</button>
                </div>
            `;
            collectionContainer.appendChild(flowerCard);
        });

        // Add event listeners for view and delete buttons
        document.querySelectorAll('.view-details-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = event.target.getAttribute('data-index');
                showFlowerDetails(flowerCollection[index]);
            });
        });

        document.querySelectorAll('.delete-button').forEach(button => {
            button.addEventListener('click', (event) => {
                const index = event.target.getAttribute('data-index');
                flowerCollection.splice(index, 1);
                localStorage.setItem('flowerCollection', JSON.stringify(flowerCollection));
                displayFlowerCollection();
            });
        });
    }

    function showFlowerDetails(flower) {
        const detailsModal = document.createElement('div');
        detailsModal.className = 'modal';
        detailsModal.innerHTML = `
            <div class="modal-content">
                <span class="close-modal">&times;</span>
                <h2>${flower.name || 'Unknown flower'}</h2>
                <div class="species-name">${flower.details.species || ''}</div>
                <img src="${flower.imageDataUrl}" alt="${flower.name || 'Unknown flower'}" class="flower-image">
                <div class="flower-details">
                    <pre>${JSON.stringify(flower.details, null, 2)}</pre>
                </div>
            </div>
        `;
        document.body.appendChild(detailsModal);

        detailsModal.style.display = 'block';
        detailsModal.querySelector('.close-modal').addEventListener('click', () => {
            detailsModal.style.display = 'none';
            detailsModal.remove();
        });
    }

    // Modal functionality
    settingsButton.addEventListener('click', () => {
        settingsModal.style.display = 'block';
    });

    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none';
        });
    });

    // Close modal when clicking outside the modal content
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Camera functionality
    takePictureButton.addEventListener('click', async () => {
        try {
            // Hide the image preview if it's showing
            imagePreview.style.display = 'none';
            
            // Show the camera container
            cameraContainer.style.display = 'block';
            
            // Get access to the camera
            mediaStream = await navigator.mediaDevices.getUserMedia({ 
                video: { facingMode: 'environment' } // Use back camera if available
            });
            
            // Display the camera preview
            cameraPreview.srcObject = mediaStream;
            cameraPreview.style.display = 'block';
            cameraPreview.play();
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert('Error accessing camera: ' + error.message);
            cameraContainer.style.display = 'none';
        }
    });

    capturePictureButton.addEventListener('click', () => {
        if (!mediaStream) return;
        
        // Create a canvas to capture the frame
        const canvas = document.createElement('canvas');
        canvas.width = cameraPreview.videoWidth;
        canvas.height = cameraPreview.videoHeight;
        const ctx = canvas.getContext('2d');
        
        // Draw the current video frame on the canvas
        ctx.drawImage(cameraPreview, 0, 0, canvas.width, canvas.height);
        
        // Convert to data URL
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        
        // Display in the preview
        imagePreview.src = imageDataUrl;
        imagePreview.style.display = 'block';
        removeImageButton.style.display = 'block';
        
        // Stop the camera and hide the camera container
        stopCamera();
    });

    cancelCameraButton.addEventListener('click', () => {
        stopCamera();
    });

    function stopCamera() {
        // Stop the camera stream
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }
        
        // Hide the camera preview
        cameraPreview.style.display = 'none';
        cameraPreview.srcObject = null;
        
        // Hide the camera container
        cameraContainer.style.display = 'none';
    }

    // Event Listeners
    saveApiKeyButton.addEventListener('click', () => {
        shapesApiKey = apiKeyInput.value.trim();
        if (shapesApiKey) {
            localStorage.setItem('shapesApiKey', shapesApiKey);
            alert('API Key saved!');
            settingsModal.style.display = 'none';
        } else {
            alert('Please enter a valid API Key.');
        }
    });

    flowerImageInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreview.style.display = 'block';
                removeImageButton.style.display = 'block';
                
                // Make sure camera is stopped if it was active
                stopCamera();
            }
            reader.readAsDataURL(file);
            identificationResult.innerHTML = '<p>Ready to identify...</p>';
        } else {
            imagePreview.style.display = 'none';
            removeImageButton.style.display = 'none';
            imagePreview.src = '#';
        }
    });

    identifyFlowerButton.addEventListener('click', async () => {
        if (!shapesApiKey) {
            alert('Please save your Shapes API Key first.');
            settingsModal.style.display = 'block';
            return;
        }
        
        // Check if we have an image from either camera or file upload
        if (!imagePreview.src || imagePreview.src === '#' || imagePreview.src === window.location.href) {
            alert('Please take or upload an image first.');
            return;
        }

        identificationResult.innerHTML = '<p>Identifying, please wait...</p>';

        try {
            const imageDataUrl = imagePreview.src; // Get the data URL from the preview image
            const response = await callShapesApiForIdentification(imageDataUrl);
            const result = displayIdentificationResult(response);
            
            // Add to collection if identification was successful
            if (result) {
                const flowerData = {
                    imageDataUrl: imageDataUrl,
                    name: result.name || 'Unknown flower',
                    details: result,
                    date: new Date().toLocaleString()
                };
                
                flowerCollection.push(flowerData);
                localStorage.setItem('flowerCollection', JSON.stringify(flowerCollection));
                displayFlowerCollection();
                
                // Switch to collection tab to show the newly added flower
                document.querySelector('.tab-item[data-tab="collectionTab"]').click();
                
                // Get Flora's comment on the identified flower
                try {
                    await getFloraCommentOnFlower(result);
                } catch (commentError) {
                    console.error('Error getting Flora\'s comment:', commentError);
                }
            }
        } catch (error) {
            console.error('Error identifying flower:', error);
            identificationResult.innerHTML = `<p class="error">Error: Unable to identify flower. Please try again.</p>`;
        }
    });

    sendMessageButton.addEventListener('click', async () => {
        const message = chatInput.value.trim();
        if (!message) return;

        if (!shapesApiKey) {
            alert('Please save your Shapes API Key first.');
            settingsModal.style.display = 'block';
            return;
        }

        appendMessage(message, 'user');
        chatInput.value = '';

        try {
            const response = await callShapesApiForChat(message);
            appendMessage(response.choices[0].message.content, 'flora');
        } catch (error) {
            console.error('Error sending message:', error);
            appendMessage(`Error: ${error.message}`, 'flora');
        }
    });

    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            sendMessageButton.click();
        }
    });

    function appendMessage(text, sender) {
        const messageElement = document.createElement('p');
        messageElement.textContent = text;
        messageElement.classList.add(sender === 'user' ? 'user-message' : 'flora-message');
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
    }

    // API Call Functions
    async function callShapesApiForIdentification(imageDataUrl) {
        // Convert data URL to a format acceptable for the API
        // If the API accepts base64 directly, we extract the base64 part
        const payload = {
            model: FLORA_MODEL_ID,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Analyze this image of a flower. Please identify the flower species, common name, and provide brief care instructions including light requirements, watering needs, and soil preferences. Return your analysis as a valid JSON object with the following properties: 'name' (common name), 'species' (scientific name), 'care' (care instructions), 'light', 'water', and 'soil' preferences."
                        },
                        {
                            type: "image_url",
                            image_url: {
                                url: imageDataUrl // Using the data URL directly
                            }
                        }
                    ]
                }
            ]
        };

        const response = await fetch(`${SHAPES_API_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${shapesApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API request failed');
        }

        return await response.json();
    }

    async function callShapesApiForChat(userMessage) {
        const payload = {
            model: FLORA_MODEL_ID,
            messages: [
                {
                    role: "system",
                    content: "You are Flora, a helpful and friendly plant care assistant. You specialize in flower identification and care advice. Your responses should be informative yet concise. When asked about specific flowers, provide useful care information."
                },
                {
                    role: "user",
                    content: userMessage
                }
            ]
        };

        const response = await fetch(`${SHAPES_API_BASE_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${shapesApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API request failed');
        }

        return await response.json();
    }

    function displayIdentificationResult(apiResponse) {
        try {
            // Parse the JSON response from the model
            const messageContent = apiResponse.choices[0].message.content;
            
            // Try to parse it as JSON first
            let flowerData;
            try {
                flowerData = JSON.parse(messageContent);
            } catch (jsonError) {
                // If it's not valid JSON, try to extract JSON from the text content
                const jsonMatch = messageContent.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    flowerData = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error("Could not extract valid JSON data");
                }
            }
            
            // Create a simplified result display
            identificationResult.innerHTML = `
                <div class="identification-success">
                    <h3>✓ Flower Identified</h3>
                    <p><strong class="flower-title">${flowerData.name || 'Unknown Flower'}</strong></p>
                    <p class="species-name">${flowerData.species || 'Species unknown'}</p>
                    <div class="care-tips">
                        <p><strong>Care Tips:</strong> ${flowerData.care || 'Not available'}</p>
                        <ul>
                            <li><strong>Light:</strong> ${flowerData.light || 'Not specified'}</li>
                            <li><strong>Water:</strong> ${flowerData.water || 'Not specified'}</li>
                            <li><strong>Soil:</strong> ${flowerData.soil || 'Not specified'}</li>
                        </ul>
                    </div>
                </div>
            `;
            
            return flowerData;
        } catch (error) {
            console.error('Error parsing identification result:', error);
            identificationResult.innerHTML = `
                <div class="identification-error">
                    <h3>✗ Identification Failed</h3>
                    <p>Unable to identify this flower. Please try a clearer image.</p>
                </div>
            `;
            return null;
        }
    }

    async function getFloraCommentOnFlower(flowerDetails) {
        // Prepare a personalized message about the identified flower
        const message = `I just identified a ${flowerDetails.name || 'flower'}! Can you tell me something interesting about it?`;
        
        try {
            const response = await callShapesApiForChat(message);
            const comment = response.choices[0].message.content;
            
            // Switch to the chat tab
            document.querySelector('.tab-item[data-tab="chatTab"]').click();
            
            // Add the messages to the chat
            appendMessage(message, 'user');
            appendMessage(comment, 'flora');
        } catch (error) {
            console.error('Error getting Flora comment:', error);
        }
    }

    // Add event listener for Remove Image button
    removeImageButton.addEventListener('click', () => {
        // Clear the image preview
        imagePreview.src = '#';
        imagePreview.style.display = 'none';
        removeImageButton.style.display = 'none';
        
        // Reset the file input
        flowerImageInput.value = '';
        
        // Reset the identification result
        identificationResult.innerHTML = '<p>Identification results will appear here...</p>';
    });
    
    // Initialize the collection display
    displayFlowerCollection();
}); 