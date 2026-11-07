# -*- coding: utf-8 -*-
"""共享异常类型：传输层与控制器都从这里取，避免控制器反向 import server。"""


class ApiError(Exception):
    def __init__(self, msg, status=400):
        self.msg, self.status = msg, status
        super().__init__(msg)
