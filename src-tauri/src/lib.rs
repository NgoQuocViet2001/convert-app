pub mod convert;
pub mod system;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use std::io::Write;
    use std::panic;

    panic::set_hook(Box::new(|info| {
        if let Some(mut dir) = std::env::temp_dir().canonicalize().ok() {
            dir.push("caj2pdf-panic.log");
            if let Ok(mut f) = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(&dir)
            {
                let _ = writeln!(f, "{}", info);
            }
        }
        eprintln!("⚠️ PANIC: {info}");
    }));

    let result = panic::catch_unwind(|| {
        tauri::Builder::default()
            .plugin(tauri_plugin_shell::init())
            .plugin(tauri_plugin_dialog::init())
            .invoke_handler(tauri::generate_handler![
                // convert
                crate::convert::cajtopdf::convert_caj_to_pdf,
                // system
                crate::system::move_output,
                crate::system::open_file,
                crate::system::reveal_in_folder,
                crate::system::delete_file,
            ])
            .run(tauri::generate_context!())
            .expect("Error while running Tauri app");
    });

    if let Err(e) = result {
        eprintln!("❌ Uncaught panic: {:?}", e);
    }
}
