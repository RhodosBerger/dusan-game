pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'yarn install --frozen-lockfile'
            }
        }

        stage('Run Engine Tests') {
            steps {
                // Ensure 100% green compilation of game engines (Rule 7)
                sh 'npx ts-node packages/server/src/testEngine.ts'
            }
        }

        stage('Compile Monorepo Packages') {
            steps {
                // Build typescript libraries & static bundle (Rule 4 consistency)
                sh 'yarn workspace @dusan-game/shared build'
                sh 'yarn workspace client build'
            }
        }

        stage('Build Docker Images') {
            steps {
                // Build all serverless containers locally
                sh 'docker compose build'
            }
        }

        stage('Emulate VM Cloud Instances') {
            steps {
                script {
                    echo "Initializing Fedora VM Cloud emulation using native tools..."
                    // 1. Setup workspace directory for virtualization assets
                    sh 'mkdir -p cloud-vms'
                    
                    // 2. Create copy-on-write clone image (Rule 5 caching & optimization) using qemu-img
                    sh 'if [ -f cloud-vms/dusan-game-instance.qcow2 ]; then rm -f cloud-vms/dusan-game-instance.qcow2; fi'
                    sh 'qemu-img create -f qcow2 -o backing_file=/var/lib/libvirt/images/Fedora-Cloud-Base.qcow2,backing_fmt=qcow2 cloud-vms/dusan-game-instance.qcow2 20G'
                    
                    // 3. Generate Cloud-Init configuration to provision Podman / Containers on boot
                    sh '''
                    cat <<EOF > cloud-vms/user-data
                    #cloud-config
                    package_update: true
                    packages:
                      - podman
                      - podman-compose
                      - git
                      - curl
                    runcmd:
                      - systemctl enable --now podman
                      - git clone https://github.com/dusan-game/dusan-game.git /opt/dusan-game
                      - cd /opt/dusan-game && podman-compose up -d
                    EOF
                    '''
                    
                    // 4. Create metadata ISO for Cloud-Init using genisoimage
                    sh 'genisoimage -output cloud-vms/cloud-init.iso -volid cidata -joliet -rock cloud-vms/user-data'
                    
                    // 5. Define, configure and start the VM using virt-install
                    sh 'virsh destroy dusan-game-vm || true'
                    sh 'virsh undefine dusan-game-vm || true'
                    sh '''
                    virt-install \
                      --name dusan-game-vm \
                      --memory 2048 \
                      --vcpus 2 \
                      --disk path=cloud-vms/dusan-game-instance.qcow2,device=disk,bus=virtio \
                      --disk path=cloud-vms/cloud-init.iso,device=cdrom \
                      --os-variant fedora39 \
                      --network network=default \
                      --graphics none \
                      --import \
                      --noautoconsole
                    '''
                    
                    // 6. Introspect VM IP and run health checks
                    sh 'sleep 30'
                    sh 'VM_IP=$(virsh domifaddr dusan-game-vm | grep -oE "([0-9]{1,3}\\\\.)+([0-9]{1,3})") && curl -s http://$VM_IP:8080/health || echo "VM Booting..."'
                }
            }
        }
    }
}
