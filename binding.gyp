{
  'targets': [
    {
      'target_name': 'soem_addon',
      'sources': [
        'src/addon.cc',
        'external/soem/src/ec_base.c',
        'external/soem/src/ec_coe.c',
        'external/soem/src/ec_config.c',
        'external/soem/src/ec_dc.c',
        'external/soem/src/ec_eoe.c',
        'external/soem/src/ec_foe.c',
        'external/soem/src/ec_main.c',
        'external/soem/src/ec_print.c',
        'external/soem/src/ec_soe.c'
      ],
      'include_dirs': [
        '<!(node -p "require(\'node-addon-api\').include")',
        '<(module_root_dir)/node_modules/node-addon-api',
        '<(module_root_dir)/include',
        '<(module_root_dir)/external/soem/include',
        '<(module_root_dir)/external/soem/osal',
        '<(module_root_dir)/external/soem/oshw',
        '<(SHARED_INTERMEDIATE_DIR)',
        '<(SHARED_INTERMEDIATE_DIR)/soem'
      ],
      'dependencies': [
        '<!(node -p "require(\'node-addon-api\').gyp")'
      ],
      'defines': [
        'NAPI_VERSION=8',
        'NODE_ADDON_API_CPP_EXCEPTIONS'
      ],
      'cflags_cc': [
        '-std=c++17',
        '-fexceptions'
      ],
      'actions': [
        {
          'action_name': 'generate_ec_options',
          'inputs': [
            '<(module_root_dir)/external/soem/include/soem/ec_options.h.in',
            '<(module_root_dir)/scripts/generate-ec-options.js'
          ],
          'outputs': [
            '<(SHARED_INTERMEDIATE_DIR)/soem/ec_options.h'
          ],
          'action': [
            'node',
            '<(module_root_dir)/scripts/generate-ec-options.js',
            '<(module_root_dir)/external/soem/include/soem/ec_options.h.in',
            '<(SHARED_INTERMEDIATE_DIR)/soem/ec_options.h'
          ]
        }
      ],
      'conditions': [
        [
          'OS=="linux" or OS=="freebsd" or OS=="openbsd" or OS=="solaris"',
          {
            'sources+': [
              'external/soem/osal/linux/osal.c',
              'external/soem/oshw/linux/oshw.c',
              'external/soem/oshw/linux/nicdrv.c'
            ],
            'include_dirs+': [
              '<(module_root_dir)/external/soem/osal/linux',
              '<(module_root_dir)/external/soem/oshw/linux'
            ],
            'libraries': [
              '-lrt',
              '-lpthread'
            ]
          }
        ],
        [
          'OS=="win"',
          {
            'sources+': [
              'external/soem/osal/win32/osal.c',
              'external/soem/oshw/win32/oshw.c',
              'external/soem/oshw/win32/nicdrv.c'
            ],
            'include_dirs+': [
              '<(module_root_dir)/external/soem/osal/win32',
              '<(module_root_dir)/external/soem/oshw/win32',
              '<(module_root_dir)/external/soem/oshw/win32/wpcap/Include'
            ],
            'defines+': [
              '_CRT_SECURE_NO_WARNINGS'
            ],
            'msvs_settings': {
              'VCCLCompilerTool': {
                'AdditionalOptions': [
                  '/std:c++17'
                ],
                'ExceptionHandling': 1
              }
            },
            'conditions': [
              [
                'target_arch=="x64"',
                {
                  'libraries': [
                    '<(module_root_dir)/external/soem/oshw/win32/wpcap/Lib/x64/wpcap.lib',
                    '<(module_root_dir)/external/soem/oshw/win32/wpcap/Lib/x64/Packet.lib',
                    'ws2_32.lib',
                    'winmm.lib'
                  ]
                },
                {
                  'libraries': [
                    '<(module_root_dir)/external/soem/oshw/win32/wpcap/Lib/wpcap.lib',
                    '<(module_root_dir)/external/soem/oshw/win32/wpcap/Lib/Packet.lib',
                    'ws2_32.lib',
                    'winmm.lib'
                  ]
                }
              ]
            ]
          }
        ]
      ]
    }
  ]
}
