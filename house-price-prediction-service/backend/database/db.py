#!/usr/bin/env python3
# -*- coding: utf-8 -*-
from backend.app.admin.model import models as admin_models
from backend.app.prediction.model import models as prediction_models
from backend.core.conf import settings

mysql_config = {
    'connections': {
        'default': {
            'engine': 'tortoise.backends.mysql',
            'credentials': {
                'host': f'{settings.DATABASE_HOST}',
                'port': settings.DATABASE_PORT,
                'user': f'{settings.DATABASE_USER}',
                'password': f'{settings.DATABASE_PASSWORD}',
                'database': f'{settings.DATABASE_SCHEMA}',
                'charset': f'{settings.DATABASE_ENCODING}',
                'echo': settings.DATABASE_ECHO,
            },
        },
    },
    'apps': {
        'ftm': {
            'models': [*admin_models, *prediction_models],
            'default_connection': 'default',
        },
    },
    'use_tz': False,
    'timezone': settings.DATABASE_TIMEZONE,
}
