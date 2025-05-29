@echo off
echo 🧹 MathCoin - Limpeza de Arquivos Errados
echo ==========================================
echo.

REM Apagar todos os arquivos vazios (0 bytes) que foram criados erroneamente
echo 🗑️ Removendo arquivos vazios...

del /q .android 2>nul
del /q .cache 2>nul
del /q .codeium 2>nul
del /q .config 2>nul
del /q .expo 2>nul
del /q .fly 2>nul
del /q .fontconfig 2>nul
del /q .gradle 2>nul
del /q .kindle 2>nul
del /q .ollama 2>nul
del /q .pkg-cache 2>nul
del /q .vscode 2>nul
del /q .windsurf 2>nul
del /q AMD 2>nul
del /q AndroidStudioProjects 2>nul
del /q Anexos 2>nul
del /q Aplicativos 2>nul
del /q Carteira 2>nul
del /q CCB 2>nul
del /q cd 2>nul
del /q chat 2>nul
del /q chatp2p 2>nul
del /q chatp2p-desktop 2>nul
del /q chatp2p-distribuidor 2>nul
del /q COBICTI 2>nul
del /q com.psa.chatp2p 2>nul
del /q Contacts 2>nul
del /q copy 2>nul
del /q COREL.rep 2>nul
del /q CURSOS 2>nul
del /q defaultuser100000 2>nul
del /q dir 2>nul
del /q dist 2>nul
del /q Documentos 2>nul
del /q Documents 2>nul
del /q Downloads 2>nul
del /q edb 2>nul
del /q Favorites 2>nul
del /q gradle-8.13 2>nul
del /q Imagens 2>nul
del /q languages 2>nul
del /q Links 2>nul
del /q Livros 2>nul
del /q MactTutor 2>nul
del /q MacTutor 2>nul
del /q mathcoin 2>nul
del /q MenuFuturista 2>nul
del /q MESTRADO 2>nul
del /q Meus 2>nul
del /q mkdir 2>nul
del /q Music 2>nul
del /q node 2>nul
del /q notepad 2>nul
del /q Nova 2>nul
del /q npm-cache 2>nul
del /q OneDrive 2>nul
del /q PerfLogs 2>nul
del /q Program 2>nul
del /q PROJETO 2>nul
del /q PROVAS 2>nul
del /q psapa 2>nul
del /q Public 2>nul
del /q rmdir 2>nul
del /q Saved 2>nul
del /q Searches 2>nul
del /q SITE 2>nul
del /q teste 2>nul
del /q UFPI 2>nul
del /q Users 2>nul
del /q Videos 2>nul
del /q Voiceover 2>nul
del /q wget 2>nul
del /q Windows 2>nul
del /q xampp 2>nul
del /q yt-dlp 2>nul
del /q Área 2>nul

echo ✅ Limpeza concluída!
echo.
echo 📁 Estrutura limpa do projeto:
dir /b

echo.
echo 🎯 Agora você pode criar o script de configuração:
echo    notepad create-config.js
echo.
echo 💎 Suas 140 MathCoins estão esperando!
pause
