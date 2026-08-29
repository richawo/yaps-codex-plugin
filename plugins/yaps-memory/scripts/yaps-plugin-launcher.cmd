@echo off
setlocal EnableExtensions DisableDelayedExpansion

rem Start the privacy-safe Yaps plugin runner without assuming Node is on PATH.
rem Codex Desktop supplies CODEX_MCP_NODE_PATH to local tasks on a clean
rem Windows profile; the remaining probes keep the launcher useful in other
rem local-capable hosts and development shells.

set "runner_path=%~dp0yaps-plugin-runner.mjs"
if not exist "%runner_path%" (
  1>&2 echo Yaps could not find its local connector runner. Reinstall the Yaps plugin and try again.
  exit /b 127
)

set "node_binary="

if defined YAPS_PLUGIN_NODE_BINARY call :use_if_file "%YAPS_PLUGIN_NODE_BINARY%"
if not defined node_binary if defined CODEX_MCP_NODE_PATH call :use_if_file "%CODEX_MCP_NODE_PATH%"
if not defined node_binary call :find_path_node
if not defined node_binary if defined CODEX_ELECTRON_RESOURCES_PATH call :use_if_file "%CODEX_ELECTRON_RESOURCES_PATH%\cua_node\bin\node.exe"
if not defined node_binary if defined CODEX_CLI_PATH call :find_next_to_codex_cli

if not defined node_binary if defined LOCALAPPDATA call :use_if_file "%LOCALAPPDATA%\Programs\ChatGPT\resources\cua_node\bin\node.exe"
if not defined node_binary if defined LOCALAPPDATA call :use_if_file "%LOCALAPPDATA%\Programs\Codex\resources\cua_node\bin\node.exe"
if not defined node_binary if defined ProgramFiles call :use_if_file "%ProgramFiles%\ChatGPT\resources\cua_node\bin\node.exe"
if not defined node_binary if defined ProgramFiles call :use_if_file "%ProgramFiles%\Codex\resources\cua_node\bin\node.exe"

if not defined node_binary (
  1>&2 echo Yaps could not start its local connector with this Codex installation. Update Codex and reinstall the Yaps plugin, then try again.
  exit /b 127
)

"%node_binary%" "%runner_path%" %*
exit /b %errorlevel%

:use_if_file
if defined node_binary exit /b 0
if exist "%~1" set "node_binary=%~1"
exit /b 0

:find_path_node
for /f "delims=" %%I in ('where node.exe 2^>nul') do if not defined node_binary set "node_binary=%%I"
exit /b 0

:find_next_to_codex_cli
for %%I in ("%CODEX_CLI_PATH%") do call :use_if_file "%%~dpIcua_node\bin\node.exe"
exit /b 0
