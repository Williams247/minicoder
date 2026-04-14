use serde::Serialize;
use std::io::Write;
use std::process::Command;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct EditorDiagnostic {
    /// 0-based line index for Ace `setAnnotations`.
    pub row: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub column: Option<u32>,
    pub text: String,
}

fn parse_line_from_php_output(output: &str) -> Option<u32> {
    let needle = "on line ";
    let pos = output.rfind(needle)?;
    let rest = output[pos + needle.len()..]
        .chars()
        .take_while(|c| c.is_ascii_digit())
        .collect::<String>();
    rest.parse().ok()
}

fn message_from_php_output(output: &str) -> String {
    output
        .lines()
        .filter(|l| {
            let t = l.trim();
            !t.is_empty() && !t.starts_with("Errors parsing")
        })
        .last()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(String::from)
        .unwrap_or_else(|| output.trim().to_string())
}

/// Runs `php -l` on a temp copy of the source. Returns Ace annotations (empty if valid or PHP missing).
#[tauri::command]
pub fn lint_php(source: String) -> Vec<EditorDiagnostic> {
    let Ok(mut tmp) = tempfile::Builder::new().suffix(".php").tempfile() else {
        return vec![];
    };
    if tmp.write_all(source.as_bytes()).is_err() || tmp.flush().is_err() {
        return vec![];
    }
    let path = tmp.path().to_path_buf();

    let output = match Command::new("php").arg("-l").arg(&path).output() {
        Ok(o) => o,
        Err(_) => return vec![],
    };

    if output.status.success() {
        return vec![];
    }

    let stderr = String::from_utf8_lossy(&output.stderr);
    let stdout = String::from_utf8_lossy(&output.stdout);
    let combined = if stderr.trim().is_empty() {
        stdout.into_owned()
    } else {
        stderr.into_owned()
    };

    let line_1based = parse_line_from_php_output(&combined).unwrap_or(1);
    let row = line_1based.saturating_sub(1);
    let text = message_from_php_output(&combined);

    vec![EditorDiagnostic {
        row,
        column: None,
        text,
    }]
}
