import pytest

from app.config import BACKEND_DIRECTORY, get_environment_file


@pytest.mark.parametrize(
    ("app_env", "file_name"),
    [
        ("local", ".env.local"),
        ("prod", ".env.prod"),
        (" LOCAL ", ".env.local"),
    ],
)
def test_get_environment_file(app_env: str, file_name: str) -> None:
    expected_file = BACKEND_DIRECTORY / file_name

    assert get_environment_file(app_env) == expected_file


def test_get_environment_file_rejects_unknown_environment() -> None:
    with pytest.raises(ValueError, match="APP_ENV must be either 'local' or 'prod'"):
        get_environment_file("staging")
