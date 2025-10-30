use std::fs;
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;

#[tauri::command]
pub async fn move_output(from: String, to: String) -> Result<(), String> {
    use std::io;
    match fs::rename(&from, &to) {
        Ok(_) => Ok(()),
        Err(e) => {
            if e.kind() == io::ErrorKind::CrossesDevices {
                fs::copy(&from, &to).map_err(|e| format!("Copy failed: {e}"))?;
                fs::remove_file(&from).map_err(|e| format!("Remove temp failed: {e}"))?;
                Ok(())
            } else {
                Err(format!("Move failed: {e}"))
            }
        }
    }
}

#[tauri::command]
pub async fn open_file(app: AppHandle, path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let mut c = app.shell().command("cmd");
        c = c.args(["/C", "start", "", &path]);
        c.spawn().map_err(|e| e.to_string())?;
        return Ok(());
    }
    #[cfg(target_os = "macos")]
    {
        let mut c = app.shell().command("open");
        c = c.arg(&path);
        c.spawn().map_err(|e| e.to_string())?;
        return Ok(());
    }
    #[cfg(target_os = "linux")]
    {
        let mut c = app.shell().command("xdg-open");
        c = c.arg(&path);
        c.spawn().map_err(|e| e.to_string())?;
        return Ok(());
    }
}

#[tauri::command]
pub async fn reveal_in_folder(app: AppHandle, path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        let mut c = app.shell().command("explorer.exe");
        c = c.args(["/select,", &path]);
        c.spawn().map_err(|e| e.to_string())?;
        return Ok(());
    }
    #[cfg(target_os = "macos")]
    {
        let mut c = app.shell().command("open");
        c = c.args(["-R", &path]);
        c.spawn().map_err(|e| e.to_string())?;
        return Ok(());
    }
    #[cfg(target_os = "linux")]
    {
        use std::path::Path;
        let parent = Path::new(&path).parent().ok_or("No parent dir")?;
        let mut c = app.shell().command("xdg-open");
        c = c.arg(parent.to_string_lossy().to_string());
        c.spawn().map_err(|e| e.to_string())?;
        return Ok(());
    }
}

#[tauri::command]
pub async fn delete_file(path: String) -> Result<(), String> {
    fs::remove_file(&path).map_err(|e| e.to_string())
}