use std::{fs, path::PathBuf};

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_shell::ShellExt;
use uuid::Uuid;

#[derive(Serialize, Clone)]
struct ProgressPayload<'a> {
    input: &'a str,
    phase: &'a str,
    message: Option<String>,
    percent: Option<f64>,
}

/* Tự dò thư mục resources riêng cho converter này */
fn resolve_resource_dirs(app: &tauri::AppHandle) -> Result<(PathBuf, PathBuf), String> {
    let mut tried: Vec<PathBuf> = Vec::new();

    if let Ok(res_dir) = app.path().resource_dir() {
        for base in [res_dir.clone(), res_dir.join("resources")] {
            tried.push(base.join("caj2pdf"));
            tried.push(base.join("tools"));
            if base.join("caj2pdf").exists() && base.join("tools").exists() {
                return Ok((base.join("caj2pdf"), base.join("tools")));
            }
        }
    }

    if let Ok(mut exe_dir) = std::env::current_exe() {
        exe_dir.pop();
        for base in [exe_dir.clone(), exe_dir.join("resources")] {
            tried.push(base.join("caj2pdf"));
            tried.push(base.join("tools"));
            if base.join("caj2pdf").exists() && base.join("tools").exists() {
                return Ok((base.join("caj2pdf"), base.join("tools")));
            }
        }

        let mut cur = exe_dir.clone();
        for _ in 0..6 {
            let base1 = cur.join("src-tauri").join("resources");
            tried.push(base1.join("caj2pdf"));
            tried.push(base1.join("tools"));
            if base1.join("caj2pdf").exists() && base1.join("tools").exists() {
                return Ok((base1.join("caj2pdf"), base1.join("tools")));
            }
            let base2 = cur.join("resources");
            tried.push(base2.join("caj2pdf"));
            tried.push(base2.join("tools"));
            if base2.join("caj2pdf").exists() && base2.join("tools").exists() {
                return Ok((base2.join("caj2pdf"), base2.join("tools")));
            }
            if !cur.pop() {
                break;
            }
        }
    }

    let mut msg = String::from("Cannot locate resources (caj2pdf/tools). Tried:\n");
    for p in tried {
        msg.push_str(&format!(" - {}\n", p.display()));
    }
    Err(msg)
}

fn parse_percent(s: &str) -> Option<f64> {
    let mut last = None;
    for tok in s.split(|c: char| !c.is_ascii_digit()) {
        if tok.is_empty() {
            continue;
        }
        if let Ok(v) = tok.parse::<u32>() {
            if (0..=100).contains(&v) {
                last = Some(v as f64);
            }
        }
    }
    last
}

#[tauri::command]
pub async fn convert_caj_to_pdf(
    app: AppHandle,
    input_path: String,
    ocr: bool,
) -> Result<String, String> {
    use std::io::Write;

    let write_log = |lines: &[&str]| {
        if let Ok(dir) = app.path().app_local_data_dir() {
            let _ = std::fs::create_dir_all(&dir);
            let log_path = dir.join("last_run.log");
            if let Ok(mut f) = std::fs::OpenOptions::new()
                .create(true)
                .append(true)
                .open(&log_path)
            {
                for l in lines {
                    let _ = writeln!(f, "{l}");
                }
            }
        }
    };

    // 1) validate input
    let meta = fs::metadata(&input_path).map_err(|e| {
        let msg = format!("Cannot read input: {e}");
        write_log(&[&msg]);
        msg
    })?;
    if !meta.is_file() {
        let msg = "Input is not a file".to_string();
        write_log(&[&msg]);
        return Err(msg);
    }

    // 2) output & workdir
    let out_dir = app.path().app_local_data_dir().map_err(|e| {
        let msg = format!("app_local_data_dir error: {e}");
        write_log(&[&msg]);
        msg
    })?;
    let work_dir = out_dir.join(format!("run-{}", Uuid::new_v4()));
    fs::create_dir_all(&work_dir).map_err(|e| format!("Cannot create work dir: {e}"))?;

    fs::create_dir_all(&out_dir).map_err(|e| {
        let msg = format!("Cannot create app data dir: {e}");
        write_log(&[&msg]);
        msg
    })?;
    let out_name = format!("{}.pdf", Uuid::new_v4());
    let out_path: PathBuf = out_dir.join(out_name);

    // 3) resources
    let (caj_dir, tools_dir) = resolve_resource_dirs(&app).map_err(|e| {
        write_log(&[&e]);
        e
    })?;
    let entry = caj_dir.join("caj2pdf");

    // 4) emit start
    let _ = app.emit(
        "convert-progress",
        ProgressPayload {
            input: &input_path,
            phase: "start",
            message: Some(format!("Spawning converter (cwd={})", caj_dir.display())),
            percent: Some(0.0),
        },
    );
    let vendor = caj_dir.join("vendor");

    // 5) args
    // 5) args
    let launcher = format!(
        r#"
import sys, runpy, os
sys.path.insert(0, r"{caj}")
sys.path.insert(1, r"{vendor}")
os.chdir(r"{caj}")
runpy.run_path(r"{entry}", run_name="__main__")
"#,
        caj = caj_dir.display(),
        vendor = vendor.display(),
        entry = entry.display()
    );

    let mut args: Vec<String> = vec![
        "-c".into(),
        launcher,
        "convert".into(),
        input_path.clone(),
        "--output".into(),
        out_path.to_string_lossy().into_owned(),
    ];
    if ocr {
        args.push("--ocr".into());
    }

    // 6) shell command
    let shell = app.shell();
    let build_cmd = |prog: &str, extra: &[&str]| {
        let mut c = shell.command(prog);
        for a in extra {
            c = c.arg(a.to_string());
        }
        for a in &args {
            c = c.arg(a.to_string());
        }
        c.current_dir(&caj_dir) // <<-- thay vì work_dir
    };

    let pythonpath = if vendor.exists() {
        format!("{};{}", caj_dir.display(), vendor.display())
    } else {
        caj_dir.to_string_lossy().to_string()
    };

    use tauri_plugin_shell::process::{Command, CommandEvent};

    let set_envs = |mut c: Command| {
        c = c.env("PYTHONPATH", pythonpath.clone()).env("MUTOOL", {
            #[cfg(target_os = "windows")]
            {
                tools_dir
                    .join("win64")
                    .join("mutool.exe")
                    .to_string_lossy()
                    .to_string()
            }
            #[cfg(not(target_os = "windows"))]
            {
                String::new()
            }
        });
        #[cfg(target_os = "windows")]
        {
            use std::env;
            let old_path = env::var("PATH").unwrap_or_default();
            let dll_dir = caj_dir.join("lib").join("bin");
            let tools_bin = tools_dir.join("win64");
            let new_path = format!("{};{};{}", dll_dir.display(), tools_bin.display(), old_path);
            c = c.env("PATH", new_path);
        }
        c
    };

    // ƯU TIÊN: embedded python trong resources/tools/win64/python/python.exe
    #[cfg(target_os = "windows")]
    let embedded_python = tools_dir.join("win64").join("python").join("python.exe");

    let try_spawn = |prog: &str, extra: &[&str]| set_envs(build_cmd(prog, extra)).spawn();

    let mut tried: Vec<String> = vec![];
    let (mut rx, _child) = {
        #[cfg(target_os = "windows")]
        {
            if embedded_python.exists() {
                tried.push(embedded_python.to_string_lossy().to_string());
                if let Ok(x) = try_spawn(&embedded_python.to_string_lossy(), &[]) {
                    x
                } else {
                    tried.push("python".into());
                    if let Ok(x) = try_spawn("python", &[]) {
                        x
                    } else {
                        tried.push("py -3".into());
                        try_spawn("py", &["-3"]).map_err(|e| {
                            format!("Failed to start python (tried {}): {e}", tried.join(", "))
                        })?
                    }
                }
            } else {
                tried.push("python".into());
                if let Ok(x) = try_spawn("python", &[]) {
                    x
                } else {
                    tried.push("py -3".into());
                    try_spawn("py", &["-3"]).map_err(|e| {
                        format!("Failed to start python (tried {}): {e}", tried.join(", "))
                    })?
                }
            }
        }
        #[cfg(not(target_os = "windows"))]
        {
            tried.push("python3".into());
            if let Ok(x) = try_spawn("python3", &[]) {
                x
            } else {
                tried.push("python".into());
                try_spawn("python", &[]).map_err(|e| {
                    format!("Failed to start python (tried {}): {e}", tried.join(", "))
                })?
            }
        }
    };

    write_log(&[&format!(
        "Spawned with: {}",
        tried.last().unwrap_or(&"?".into())
    )]);

    // 7) stream events
    while let Some(evt) = rx.recv().await {
        match evt {
            CommandEvent::Stdout(bytes) => {
                let text = String::from_utf8_lossy(&bytes).to_string();
                let percent = parse_percent(&text);
                write_log(&[&format!("[stdout] {text}")]);
                let _ = app.emit(
                    "convert-progress",
                    ProgressPayload {
                        input: &input_path,
                        phase: "running",
                        message: Some(text.trim().into()),
                        percent,
                    },
                );
            }
            CommandEvent::Stderr(bytes) => {
                let text = String::from_utf8_lossy(&bytes).to_string();
                write_log(&[&format!("[stderr] {text}")]);
                let _ = app.emit(
                    "convert-progress",
                    ProgressPayload {
                        input: &input_path,
                        phase: "running",
                        message: Some(format!("[err] {}", text.trim())),
                        percent: None,
                    },
                );
            }
            CommandEvent::Terminated(status) => {
                write_log(&[&format!("[terminated] status={:?}", status.code)]);
                if status.code == Some(0) {
                    let _ = app.emit(
                        "convert-progress",
                        ProgressPayload {
                            input: &input_path,
                            phase: "finish",
                            message: Some("Done".into()),
                            percent: Some(100.0),
                        },
                    );
                } else {
                    let msg = format!("Converter failed with code {:?}", status.code);
                    let _ = app.emit(
                        "convert-progress",
                        ProgressPayload {
                            input: &input_path,
                            phase: "error",
                            message: Some(msg.clone()),
                            percent: None,
                        },
                    );
                    write_log(&[&msg]);
                    return Err(msg);
                }
            }
            _ => {}
        }
    }

    Ok(out_path.to_string_lossy().to_string())
}
