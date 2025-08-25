# Local AI Fiesta 🎉

Experience the local version of AI Fiesta: a powerful, privacy-focused web application for managing and interacting with multiple AI models on your own machine. Running through LM Studio, this app offers unlimited usage and lets you have multiple AI conversations side-by-side in a single, beautifully designed interface.

<!-- DEMO VIDEO: Full width below title and description -->
<p align="center">
  <video src="https://github.com/iambaljeet/Local-Fiesta/blob/main/Local%20AI-Fiesta%20DEMO.mp4" controls style="width:100%;max-width:1000px;">
    Your browser does not support the video tag.
  </video>
</p>

## ✨ Features

- **Multi-Model Chat Interface**: Chat with multiple AI models simultaneously in side-by-side windows
- **Horizontal Scrollable Layout**: Seamlessly navigate between different model conversations
- **Real-time Streaming**: Get real-time responses from AI models with streaming support
- **Model Management**: Enable/disable models on-the-fly with persistent preferences
- **File Attachments**: Support for text files, images, and documents in conversations
- **Local Storage Persistence**: Your model preferences and configuration are saved locally
- **Responsive Design**: Works beautifully on desktop and mobile devices
- **Error Handling**: Comprehensive error handling with user-friendly messages

## 🚀 Quick Start

### Prerequisites

1. **LM Studio**: Download and install [LM Studio](https://lmstudio.ai/)
2. **Node.js**: Version 18 or higher
3. **AI Models**: At least one model loaded in LM Studio

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd local-fiesta
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### LM Studio Setup

1. **Start LM Studio**
2. **Load Models**: Download and load at least one AI model
3. **Enable Local Server**: 
   - Go to the "Developer" tab
   - Click "Start Server"
   - Note the server address (usually `http://localhost:1234`)
4. **Configure in App**: Enter the LM Studio server URL when prompted

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI Components**: Radix UI, Tailwind CSS
- **State Management**: React Hooks, Local Storage
- **Notifications**: Sonner
- **Icons**: Lucide React

## 📁 Project Structure

```
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with Toaster
│   └── page.tsx           # Main application page
├── components/            # React components
│   ├── ai-dashboard.tsx   # Main dashboard component
│   └── ui/                # UI components
│       ├── configuration-dialog.tsx
│       ├── floating-prompt.tsx
│       └── model-window.tsx
├── hooks/                 # Custom React hooks
│   └── use-ai-models.ts   # AI models management hook
├── lib/                   # Utilities and services
│   ├── repos/             # Data access layer
│   │   └── lm-studio-repo.ts
│   ├── services/          # Business logic
│   │   └── storage-service.ts
│   └── utils/             # Utility functions
│       └── ai-utils.ts
└── types/                 # TypeScript type definitions
    └── ai-models.ts
```

### Model Preferences

Model preferences are automatically saved to browser localStorage:
- Enabled/disabled state per model
- LM Studio configuration
- UI preferences

## 📱 Usage

### Initial Setup
1. When you first open the app, you'll see a configuration dialog
2. Enter your LM Studio server URL (default: `http://localhost:1234`)
3. Click "Verify & Save Configuration"
4. The app will fetch available models automatically

### Managing Models
- **Enable/Disable**: Toggle the switch next to each model name
- **View Status**: Green badge = online and enabled, Yellow = online but disabled, Red = offline
- **Clear Conversations**: Use the clear button in each model window

### Chatting with Models
1. **Enable Models**: Turn on the models you want to use
2. **Type Message**: Use the floating prompt at the bottom
3. **Add Attachments**: Click the paperclip icon to add files
4. **Send**: Click send or press Cmd/Ctrl + Enter
5. **View Responses**: Responses appear in real-time in each enabled model's window

### Supported File Types
- **Text Files**: .txt, .md, .json, .js, .ts, .py, etc.
- **Images**: .jpg, .png, .gif, .webp
- **Maximum Size**: 10MB per file

## 🔄 API Integration

The app integrates with LM Studio's OpenAI-compatible API:

### Endpoints Used
- `GET /v1/models` - Fetch available models
- `POST /v1/chat/completions` - Send messages with streaming support

### Error Handling
- **Connection Errors**: Automatic retry with exponential backoff
- **Model Errors**: Individual model error handling
- **Network Issues**: Graceful degradation with user feedback

## 🎨 Customization

### Styling
The app uses Tailwind CSS with custom components. Key files:
- `app/globals.css` - Global styles
- `components/ui/` - Reusable UI components

### Adding New Features
1. **New Model Types**: Extend `AIModel` interface in `types/ai-models.ts`
2. **Custom Providers**: Create new repository in `lib/repos/`
3. **UI Enhancements**: Add components in `components/ui/`

## 🧪 Testing

Run the test suite:
```bash
npm test
```

Run linting:
```bash
npm run lint
```

Type checking:
```bash
npm run type-check
```

## 📦 Building for Production

```bash
npm run build
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Follow the coding principles in `CONTRIBUTING.md`
4. Commit changes: `git commit -m 'Add amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [LM Studio](https://lmstudio.ai/) for providing an excellent local AI model runner
- [Vercel](https://vercel.com/) for Next.js and deployment platform
- [Shadcn](https://ui.shadcn.com/) for accessible UI components
- [Tailwind CSS](https://tailwindcss.com/) for styling utilities

## 🐛 Troubleshooting

### Common Issues

**"Failed to connect to LM Studio"**
- Ensure LM Studio is running
- Check that the local server is started in LM Studio
- Verify the correct port (default: 1234)
- Check firewall settings

**"No models found"**
- Load at least one model in LM Studio
- Refresh the models list in the app
- Check LM Studio's model management tab

**"Model not responding"**
- Check if the model is properly loaded in LM Studio
- Verify the model has enough system resources
- Try restarting LM Studio

**Performance Issues**
- Reduce the number of enabled models
- Check system resource usage
- Consider using smaller models

For more help, please open an issue on GitHub.

---

Made with ❤️ for the local AI community
