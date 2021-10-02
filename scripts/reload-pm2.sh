#!/bin/bash
migrate-mongo up
pm2 reload api --update-env